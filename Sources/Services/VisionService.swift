import Foundation
import AppKit
import Vision
import CoreImage

public struct FaceAlignmentResult {
    public let zoom: Double
    public let panOffset: CGPoint
    public let tiltDegrees: Double
    public let detectedFaceCount: Int
}

public class VisionService {
    public static let shared = VisionService()
    private let ciContext = CIContext()

    private init() {}

    /// Automatically detects facial landmarks and computes optimal zoom, pan, and tilt to meet biometric standards
    public func autoAlignBiometrics(
        image: NSImage,
        targetWidthPoints: Double,
        targetHeightPoints: Double,
        completion: @escaping (Result<FaceAlignmentResult, Error>) -> Void
    ) {
        guard let tiffData = image.tiffRepresentation,
              let ciImage = CIImage(data: tiffData) else {
            completion(.failure(NSError(domain: "VisionService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"])))
            return
        }

        let requestHandler = VNImageRequestHandler(ciImage: ciImage, options: [:])
        let landmarksRequest = VNDetectFaceLandmarksRequest { request, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let observations = request.results as? [VNFaceObservation],
                  let primaryFace = observations.first else {
                completion(.failure(NSError(domain: "VisionService", code: 2, userInfo: [NSLocalizedDescriptionKey: "No face detected in photo. Please position manually."])))
                return
            }

            let imageSize = ciImage.extent.size
            let faceBox = primaryFace.boundingBox // Normalized 0..1, origin bottom-left

            // Convert face bounding box to pixel coordinates
            let facePixelRect = CGRect(
                x: faceBox.origin.x * imageSize.width,
                y: faceBox.origin.y * imageSize.height,
                width: faceBox.size.width * imageSize.width,
                height: faceBox.size.height * imageSize.height
            )

            // Calculate tilt angle from pupils if available
            var tiltDegrees: Double = 0.0
            if let landmarks = primaryFace.landmarks,
               let leftPupil = landmarks.leftPupil?.pointsInImage(imageSize: imageSize).first,
               let rightPupil = landmarks.rightPupil?.pointsInImage(imageSize: imageSize).first {
                let dx = rightPupil.x - leftPupil.x
                let dy = rightPupil.y - leftPupil.y
                let angleRad = atan2(dy, dx)
                tiltDegrees = -(angleRad * 180.0 / .pi) // Adjust tilt to make eyes horizontal
            } else if let landmarks = primaryFace.landmarks,
                      let leftEye = landmarks.leftEye?.pointsInImage(imageSize: imageSize).first,
                      let rightEye = landmarks.rightEye?.pointsInImage(imageSize: imageSize).first {
                let dx = rightEye.x - leftEye.x
                let dy = rightEye.y - leftEye.y
                let angleRad = atan2(dy, dx)
                tiltDegrees = -(angleRad * 180.0 / .pi)
            }

            // Estimate total head height (crown of hair to bottom of chin)
            // Vision's face bounding box usually covers chin to eyebrows/forehead (~65% of full head)
            let estimatedFullHeadHeight = facePixelRect.height * 1.35

            // Standard passport requires head height to be 70% to 75% of total photo height
            let desiredHeadFraction = 0.73
            let idealCropHeightPixels = estimatedFullHeadHeight / desiredHeadFraction
            let targetAspect = targetWidthPoints / targetHeightPoints
            let idealCropWidthPixels = idealCropHeightPixels * targetAspect

            // Calculate scale/zoom factor relative to fitting the image in the frame
            let baseScale = min(targetWidthPoints / imageSize.width, targetHeightPoints / imageSize.height)
            let desiredScale = targetHeightPoints / idealCropHeightPixels
            let zoom = max(0.5, min(5.0, desiredScale / baseScale))

            // Compute center of face in normalized coordinates
            let faceCenterX = facePixelRect.midX
            // Chin to eye line: eyes should sit around 62% from bottom of passport photo
            let desiredEyeYRatio = 0.62
            let faceCenterY = facePixelRect.midY

            // Calculate pan offset needed
            let imageMidX = imageSize.width / 2.0
            let imageMidY = imageSize.height / 2.0

            let dxPixels = (imageMidX - faceCenterX)
            let dyPixels = (imageMidY - faceCenterY) + (idealCropHeightPixels * (0.5 - desiredEyeYRatio))

            let panOffsetX = dxPixels * desiredScale
            let panOffsetY = dyPixels * desiredScale

            let result = FaceAlignmentResult(
                zoom: zoom,
                panOffset: CGPoint(x: panOffsetX, y: panOffsetY),
                tiltDegrees: max(-15.0, min(15.0, tiltDegrees)),
                detectedFaceCount: observations.count
            )

            completion(.success(result))
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try requestHandler.perform([landmarksRequest])
            } catch {
                completion(.failure(error))
            }
        }
    }

    /// Generates AI person segmentation mask using Apple's Neural Engine / Vision framework
    public func generateSegmentationMask(image: NSImage, completion: @escaping (CIImage?) -> Void) {
        guard let tiffData = image.tiffRepresentation,
              let ciImage = CIImage(data: tiffData) else {
            completion(nil)
            return
        }

        let request = VNGeneratePersonSegmentationRequest()
        request.qualityLevel = .balanced
        request.outputPixelFormat = kCVPixelFormatType_OneComponent8

        let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try handler.perform([request])
                guard let maskObservation = request.results?.first else {
                    completion(nil)
                    return
                }

                let maskPixelBuffer = maskObservation.pixelBuffer
                let maskCI = CIImage(cvPixelBuffer: maskPixelBuffer)

                // Scale mask up to match original image size
                let scaleX = ciImage.extent.width / maskCI.extent.width
                let scaleY = ciImage.extent.height / maskCI.extent.height
                let scaledMask = maskCI.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))

                completion(scaledMask)
            } catch {
                print("Segmentation error: \(error)")
                completion(nil)
            }
        }
    }

    /// Blends image with a clean solid background color using segmentation mask
    public func blendWithBackgroundColor(
        originalCI: CIImage,
        mask: CIImage,
        backgroundColor: NSColor
    ) -> CIImage? {
        guard let colorFilter = CIFilter(name: "CIConstantColorGenerator") else { return nil }

        let ciColor = CIColor(color: backgroundColor) ?? CIColor(red: 1, green: 1, blue: 1)
        colorFilter.setValue(ciColor, forKey: kCIInputColorKey)
        guard let solidColorImage = colorFilter.outputImage?.cropped(to: originalCI.extent) else { return nil }

        guard let blendFilter = CIFilter(name: "CIBlendWithMask") else { return nil }
        blendFilter.setValue(originalCI, forKey: kCIInputImageKey)
        blendFilter.setValue(solidColorImage, forKey: kCIInputBackgroundImageKey)
        blendFilter.setValue(mask, forKey: kCIInputMaskImageKey)

        return blendFilter.outputImage
    }
}
