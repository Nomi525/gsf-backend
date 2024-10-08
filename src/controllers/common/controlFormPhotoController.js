import { StatusCodes } from "http-status-codes";
import ResponseMessage from "../../utils/HTTPResponse.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Controller function to handle the upload and processing of the functional photo
export const uploadFunctionalPhoto = async (req, res) => {
  try {
    // Check if the file was uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.SOMETHING_WENT_WRONG,
        data: ["No file uploaded"],
      });
    }

    // Get the uploaded file information
    const imageUrl = req.files[0].filename; // Store the image filename
    // const equipmentId = req.body.equipmentId; // Get equipment Id from request body
    // **Fake Text Extraction**: Instead of using Tesseract, we return a fixed text
    // const extractedText = "7 PO 0351 DF"; // Simulated extracted text
    const extractedText = "9 HL 0214 GS"; // Simulated extracted text

    // Check if equipment id is provided
    // if (!equipmentId) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     status: StatusCodes.BAD_REQUEST,
    //     message: ResponseMessage.SOMETHING_WENT_WRONG,
    //     data: ["Equipment id is required."],
    //   });
    //}

    //  // Optionally save the equipment type in a related table or handle it as needed
    //  const newEquipment = await prisma.equipment.create({
    //   data: {
    //     type: equipmentType,
    //     imageUrl: imageUrl, // Assuming you want to link the image to the equipment
    //   },
    // });

    // Save the functional photo details to the database
    const newFunctionalPhoto = await prisma.functionalPhoto.create({
      data: {
        imageUrl: imageUrl,
        extractedText: extractedText, // Use the fake extracted text
        // equipmentId: equipmentId,
      },
    });

    // Return the response with confirmation and extracted text
    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: "Functional photo uploaded successfully.",
      data: {
        functionalPhoto: newFunctionalPhoto,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.SOMETHING_WENT_WRONG,
      data: [error.message],
    });
  }
};

// New function to handle the upload and processing of the material photo
export const uploadMaterialPhoto = async (req, res) => {
  try {
    // Check if the file was uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.SOMETHING_WENT_WRONG,
        data: ["No file uploaded"],
      });
    }

    // Get the uploaded file information
    const imageUrl = req.files[0].filename; // Store the image filename
    // const extractedText = "7 PO 0351 DF"; // Simulated extracted text
    const extractedText = "9 HL 0214 GS"; // Simulated extracted text

    // Save the material photo details to the database
    const newMaterialPhoto = await prisma.materialPhoto.create({
      data: {
        imageUrl: imageUrl,
        extractedText: extractedText, // Use the fake extracted text
      },
    });

    // // Optionally save the equipment type in a related table or handle it as needed
    // const newEquipment = await prisma.equipment.create({
    //   data: {
    //     type: equipmentType,
    //     imageUrl: imageUrl, // Assuming you want to link the image to the equipment
    //   },
    // });

    // Return the response with confirmation
    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: "Material photo uploaded successfully.",
      data: {
        materialPhoto: newMaterialPhoto,
        // equipment: newEquipment,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.SOMETHING_WENT_WRONG,
      data: [error.message],
    });
  }
};

// Controller function to create ControlFrom data
// Controller function to create ControlFrom data and return photo/equipment details
export const createControlFrom = async (req, res) => {
  try {
    const {
      functionalPhotoId,
      materialPhotoId,
      extractedText,
      equipment,
      garde_en_eau,
      presence_grille,
      etat_gille,
      presence_cloche,
      etat_cloche,
      profondeur_cloche,
      bon_ecoulement,
      controlForms,
    } = req.body;

    // Validate input
    if (
      !functionalPhotoId ||
      !materialPhotoId ||
      !extractedText ||
      !equipment
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message:
          "Functional photo ID, material photo ID, extracted text, equipment and control form data are required.",
      });
    }

    // Create ControlFrom entries
    const controlFormEntries = await prisma.controlFrom.create({
      data: {
        functionalPhotoId,
        materialPhotoId,
        extractedText,
        userId: req.user.id, // Assuming you have user authentication middleware
        ...(equipment === "Siphon de sol" && {
          garde_en_eau,
          presence_grille,
          etat_gille,
          presence_cloche,
          etat_cloche,
          profondeur_cloche,
          bon_ecoulement,
        }),

        ...(equipment === "Avalor" && {
          presence_grille,
          etat_gille,
          bon_ecoulement,
        }),

        equipment,
      },
    });

    // Fetch FunctionalPhoto and MaterialPhoto details (including Equipment)
    const functionalPhoto = await prisma.functionalPhoto.findUnique({
      where: { id: functionalPhotoId },
    });

    const materialPhoto = await prisma.materialPhoto.findUnique({
      where: { id: materialPhotoId },
    });

    // Return response with message, created control forms, and photo details
    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: `Control form data created successfully with extracted text: ${extractedText}`,
      data: {
        controlForms: controlFormEntries,
        functionalPhoto,
        materialPhoto,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.SOMETHING_WENT_WRONG,
      data: [error.message],
    });
  }
};

// Controller function to retrieve details by extractedText for the logged-in user
export const getDetailsByExtractedText = async (req, res) => {
  try {
    const { extractedText } = req.params;
    const userId = req.user.id; // Assuming user authentication middleware provides this

    console.log({ extractedText, userId });

    // Validate input
    if (!extractedText) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: "Extracted text is required.",
      });
    }

    // Find all ControlForms linked to the extractedText for the logged-in user
    const controlForms = await prisma.controlFrom.findMany({
      where: {
        extractedText: extractedText,
        userId: userId, // Filter by logged-in user's ID
      },
      include: {
        FunctionalPhoto: true,
        MaterialPhoto: true,
      },
    });

    // If no control forms are found, return a not found response
    if (controlForms.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: "No details found for the provided extracted text.",
      });
    }

    // Extract FunctionalPhoto and MaterialPhoto details (only once)
    const functionalPhoto = controlForms[0].FunctionalPhoto;
    const materialPhoto = controlForms[0].MaterialPhoto;

    // Remove FunctionalPhoto and MaterialPhoto from each controlForm to avoid repetition
    const cleanedControlForms = controlForms.map((form) => ({
      id: form.id,
      // garde_en_eau: form.title,
      // presence_grille: form.value,
      // etat_gille: form.status,
      // presence_cloche: form.extractedText,
      // etat_cloche: form.extractedText,
    }));

    // Return the response
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: "Details retrieved successfully.",
      data: {
        functionalPhoto,
        materialPhoto,
        controlForms: cleanedControlForms,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Something went wrong.",
      data: [error.message],
    });
  }
};

// Controller function to get distinct extractedText with all control form data for the logged-in user
export const getControlDetailsGroupedByExtractedText = async (req, res) => {
  try {
    console.log(req.user, "user id");

    const userId = req.user.id; // Assuming user authentication middleware provides this

    // Fetch distinct extractedText values for the logged-in user
    const distinctExtractedTexts = await prisma.controlFrom.findMany({
      where: { userId: userId }, // Only fetch data for the logged-in user
      distinct: ["extractedText"], // Fetch distinct extractedText values
      select: { extractedText: true }, // Only select extractedText
    });

    if (distinctExtractedTexts.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: "No control details found for the current user.",
      });
    }

    // Fetch all control form records for the logged-in user based on extractedText
    const controlForms = await prisma.controlFrom.findMany({
      where: { userId: userId }, // Filter by logged-in user
      include: {
        FunctionalPhoto: {
          include: {
            Equipment: true, // Get the equipment related to FunctionalPhoto
          },
        },
        MaterialPhoto: {
          include: {
            Equipment: true, // Get the equipment related to MaterialPhoto
          },
        },
      },
    });

    // Extract unique FunctionalPhoto and MaterialPhoto details
    const functionalPhotos = [
      ...new Map(
        controlForms.map((photo) => [
          photo.FunctionalPhoto.id,
          photo.FunctionalPhoto,
        ])
      ).values(),
    ];
    const materialPhotos = [
      ...new Map(
        controlForms.map((photo) => [
          photo.MaterialPhoto.id,
          photo.MaterialPhoto,
        ])
      ).values(),
    ];

    // Prepare the final response structure
    const responseData = distinctExtractedTexts.map((distinctText) => ({
      extractedText: distinctText.extractedText,
      functionalPhotos,
      materialPhotos,
      ...distinctText,
    }));

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message:
        "Control details grouped by extractedText retrieved successfully.",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Something went wrong.",
      data: [error.message],
    });
  }
};

// // New function to handle details for the functional photo
// export const saveFunctionalPhotoDetails = async (req, res) => {
//   try {
//     const { description, status, functionalPhotoId } = req.body;

//     // Validate input
//     if (!description || !status || !functionalPhotoId) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         status: StatusCodes.BAD_REQUEST,
//         message: ResponseMessage.SOMETHING_WENT_WRONG,
//         data: ["All fields are required."],
//       });
//     }

//     // Update the functional photo details in the database
//     const updatedFunctionalPhoto = await prisma.functionalPhoto.update({
//       where: { id: functionalPhotoId },
//       data: {
//         description, // Add description to the functional photo model
//         status, // Add status to the functional photo model
//       },
//     });

//     return res.status(StatusCodes.OK).json({
//       status: StatusCodes.OK,
//       message: "Functional photo details saved successfully.",
//       data: updatedFunctionalPhoto,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//       message: ResponseMessage.SOMETHING_WENT_WRONG,
//       data: [error.message],
//     });
//   }
// };

// // New function to handle details for the material photo
// export const saveMaterialPhotoDetails = async (req, res) => {
//   try {
//     const { description, status, materialPhotoId } = req.body;

//     // Validate input
//     if (!description || !status || !materialPhotoId) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         status: StatusCodes.BAD_REQUEST,
//         message: ResponseMessage.SOMETHING_WENT_WRONG,
//         data: ["Description, status, and material photo ID are required."],
//       });
//     }

//     // Update the material photo details in the database
//     const updatedMaterialPhoto = await prisma.materialPhoto.update({
//       where: { id: materialPhotoId },
//       data: {
//         description, // Add description to the material photo model
//         status, // Add status to the material photo model
//       },
//     });

//     return res.status(StatusCodes.OK).json({
//       status: StatusCodes.OK,
//       message: "Material photo details saved successfully.",
//       data: updatedMaterialPhoto,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//       message: ResponseMessage.SOMETHING_WENT_WRONG,
//       data: [error.message],
//     });
//   }
// };

// // New function to store inspection data
// export const storeInspectionData = async (req, res) => {
//   try {
//     const { functionalPhotoId, materialPhotoId, equipmentId, status, comment } =
//       req.body;

//     // Validate input
//     if (!functionalPhotoId || !materialPhotoId || !equipmentId || !status) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         status: StatusCodes.BAD_REQUEST,
//         message: ResponseMessage.SOMETHING_WENT_WRONG,
//         data: ["All fields are required."],
//       });
//     }

//     // Create a new inspection record
//     const newInspection = await prisma.inspection.create({
//       data: {
//         functionalPhotoId,
//         materialPhotoId,
//         equipmentId,
//         status,
//         comment,
//         inspectorId: req.user.id, // Assuming you're using middleware for authentication
//       },
//     });

//     return res.status(StatusCodes.CREATED).json({
//       status: StatusCodes.CREATED,
//       message: "Inspection record created successfully.",
//       data: newInspection,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//       message: ResponseMessage.SOMETHING_WENT_WRONG,
//       data: [error.message],
//     });
//   }
// };

// // New function to view inspection history
// export const viewInspectionHistory = async (req, res) => {
//   try {
//     const inspections = await prisma.inspection.findMany({
//       where: { inspectorId: req.user.id }, // Get inspections for the logged-in user
//       include: {
//         functionalPhoto: true,
//         materialPhoto: true,
//         equipment: true,
//       },
//     });

//     return res.status(StatusCodes.OK).json({
//       status: StatusCodes.OK,
//       message: "Inspection history retrieved successfully.",
//       data: inspections,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       status: StatusCodes.INTERNAL_SERVER_ERROR,
//       message: ResponseMessage.SOMETHING_WENT_WRONG,
//       data: [error.message],
//     });
//   }
// };
