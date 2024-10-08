// controllers/users.js
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Response } from "../../services/common.js";
import ResponseMessage from "../../utils/HTTPResponse.js";
import { validationResult } from "express-validator";
import ExcelJS from "exceljs"; // Import the entire ExcelJS module

const prisma = new PrismaClient();

export const usersList = async (req, res) => {
  try {
    const isActive = req.query.isActive === "true"; // Convert to boolean

    // Construct the query based on isActive parameter
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(isActive ? { isActive: true } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true, // Include createdAt for formatting
      },
      orderBy: {
        createdAt: "desc", // Sort by createdAt in descending order
      },
    });

    // Format the createdAt to only show the date (YYYY-MM-DD)
    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString().split("T")[0], // Extract only the date part
    }));

    return Response(
      res,
      StatusCodes.OK,
      ResponseMessage.USER_LIST,
      formattedUsers
    );
  } catch (err) {
    console.error(err);
    return Response(res, StatusCodes.INTERNAL_SERVER_ERROR, err.message);
  }
};

// //  function to get control details grouped by extractedText for admin, including user details
// export const getControlDetailsGroupedByExtractedTextForAdmin = async (req, res) => {
//     try {
//       // Check if the user is an admin
//       if (!req.user || req.user.type !== 'admin') {
//         return res.status(StatusCodes.FORBIDDEN).json({
//           status: StatusCodes.FORBIDDEN,
//           message: "Access denied. Admins only.",
//         });
//       }

//       // Fetch all ControlFrom records with user details
//       const controlForms = await prisma.controlFrom.findMany({
//         include: {
//           FunctionalPhoto: {
//             include: {
//               Equipment: true, // Get the equipment related to FunctionalPhoto
//             },
//           },
//           MaterialPhoto: {
//             include: {
//               Equipment: true, // Get the equipment related to MaterialPhoto
//             },
//           },
//           User: true, // Include user details
//         },
//       });

//       // If no control forms are found
//       if (controlForms.length === 0) {
//         return res.status(StatusCodes.NOT_FOUND).json({
//           status: StatusCodes.NOT_FOUND,
//           message: "No control details found.",
//         });
//       }

//       // Extract unique FunctionalPhoto and MaterialPhoto details
//       const functionalPhotos = [...new Map(controlForms.map(photo => [photo.FunctionalPhoto.id, photo.FunctionalPhoto])).values()];
//       const materialPhotos = [...new Map(controlForms.map(photo => [photo.MaterialPhoto.id, photo.MaterialPhoto])).values()];

//       // Group control forms by extractedText
//       const groupedDetails = controlForms.reduce((acc, form) => {
//         const { extractedText } = form; // Extracted text
//         const user = form.User; // User details

//         if (!acc[extractedText]) {
//           acc[extractedText] = {
//             controlForms: [],
//           };
//         }

//         acc[extractedText].controlForms.push({
//           id: form.id,
//           title: form.title,
//           value: form.value,
//           status: form.status,
//         });

//         return acc;
//       }, {});

//       // Prepare the final response structure
//       const responseData = {
//         functionalPhotos,
//         materialPhotos,
//         groupedControlForms: Object.keys(groupedDetails).map((key) => ({
//           extractedText: key,
//           controlForms: groupedDetails[key].controlForms,
//         })),
//         user: controlForms[0].User, // Get user details from the first control form
//       };

//       return res.status(StatusCodes.OK).json({
//         status: StatusCodes.OK,
//         message: "Control details grouped by extractedText retrieved successfully.",
//         data: responseData,
//       });
//     } catch (error) {
//       console.error(error);
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//         status: StatusCodes.INTERNAL_SERVER_ERROR,
//         message: "Something went wrong.",
//         data: [error.message],
//       });
//     }
//   };

// Controller function to get distinct extractedText with user list and details
export const getDistinctExtractedTextWithUserDetails = async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: StatusCodes.FORBIDDEN,
        message: "Access denied. Admins only.",
      });
    }

    // Fetch distinct extractedText values along with user associations
    const distinctExtractedTexts = await prisma.controlFrom.findMany({
      distinct: ["extractedText", "userId"], // Include userId to fetch distinct text-user pairs
      select: {
        extractedText: true,
        userId: true,
        id: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
          },
        },
      },
    });

    if (distinctExtractedTexts.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: "No control details found.",
      });
    }

    // For each distinct extractedText and user pair, fetch related control forms, functional photos, and material photos
    const extractedTextDetails = await Promise.all(
      distinctExtractedTexts.map(async (item) => {
        const controlForms = await prisma.controlFrom.findMany({
          where: {
            extractedText: item.extractedText,
            userId: item.userId, // Filter by user ID as well
          },
          include: {
            FunctionalPhoto: {
              select: {
                id: true,
                imageUrl: true,
                extractedText: true,
                // Equipment: {
                //   select: {
                //     id: true,
                //     type: true,
                //   },
                // },
              },
            },
            MaterialPhoto: {
              select: {
                id: true,
                imageUrl: true,
                extractedText: true,
                Equipment: {
                  select: {
                    id: true,
                    type: true,
                  },
                },
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

        // Group control forms by user
        const groupedControlForms = controlForms.map((form) => ({
          id: form.id,
          title: form.title,
          value: form.value,
          status: form.status,
          date: form.createdAt,
        }));

        // Return the extracted details for this text and user
        return {
          extractedText: item.extractedText,
          id: item.id,
          user: item.User, // Include the user information
          functionalPhotos,
          materialPhotos,
          controlForms: groupedControlForms,
        };
      })
    );

    // Return the response with all grouped details
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message:
        "Control details grouped by extractedText with user details retrieved successfully.",
      data: extractedTextDetails,
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

export const getControlFormsFilters = async (req, res) => {
  const { fromDate, toDate, referenceText, type } = req.body;

  try {
    // Build dynamic where clause based on received filters
    const whereClause = {
      AND: [],
    };

    // Add date range filter if both fromDate and toDate are provided
    if (fromDate && toDate) {
      const adjustedToDate = new Date(
        new Date(toDate).setHours(23, 59, 59, 999)
      );
      whereClause.AND.push({
        createdAt: {
          gte: new Date(fromDate),
          lte: adjustedToDate,
        },
      });
    }

    // Add referenceText filter if provided
    if (referenceText) {
      whereClause.AND.push({
        extractedText: {
          contains: referenceText,
          mode: "insensitive", // Case-insensitive search
        },
      });
    }

    // Add type filter for MaterialPhoto.Equipment if provided
    if (type) {
      whereClause.AND.push({
        equipment: type, // Match the provided 'type'
      });
    }

    // Fetch the control form data including user, photos, and equipment details
    const controlForms = await prisma.controlFrom.findMany({
      where: whereClause,
      include: {
        User: true, // Include User details
        FunctionalPhoto: true, // Include FunctionalPhoto details
        MaterialPhoto: true,
      },
    });

    // Respond with the grouped data
    return res.status(200).json({
      status: 200,
      message: "Control forms fetched successfully",
      data: controlForms, // Data grouped by user
    });
  } catch (error) {
    console.error("Error fetching control forms:", error);
    return res.status(500).json({
      status: 500,
      message: "Failed to fetch control forms. Please try again.",
    });
  }
};

export const exportControlForms = async (req, res) => {
  try {
    const controlForms = await prisma.controlFrom.findMany({
      include: {
        User: true,
        FunctionalPhoto: true,
        MaterialPhoto: {
          include: {
            Equipment: true,
          },
        },
      },
    });

    const groupedData = controlForms.reduce((acc, controlForm) => {
      const extractedText = controlForm.extractedText; // Extracted text
      const user = controlForm.User;

      let group = acc.find((item) => item.extractedText === extractedText);
      if (!group) {
        group = {
          extractedText,
          user: { email: user.email },
          functionalPhotos: [],
          materialPhotos: [],
          controlForms: [],
        };
        acc.push(group);
      }

      // Check if FunctionalPhoto is an object and extract its details
      if (controlForm.FunctionalPhoto) {
        const functionalPhoto = controlForm.FunctionalPhoto; // Assuming it's a single object
        group.functionalPhotos.push({
          imageUrl: functionalPhoto.imageUrl,
          extractedText: functionalPhoto.extractedText,
        });
      }

      // Handle MaterialPhoto as an array (assuming it might be an array)
      if (Array.isArray(controlForm.MaterialPhoto)) {
        controlForm.MaterialPhoto.forEach((photo) => {
          group.materialPhotos.push({
            imageUrl: photo.imageUrl,
            extractedText: photo.extractedText,
            Equipment: {
              type: photo.Equipment.type,
            },
          });
        });
      } else if (controlForm.MaterialPhoto) {
        // If MaterialPhoto is a single object, handle it as well
        const materialPhoto = controlForm.MaterialPhoto;
        group.materialPhotos.push({
          imageUrl: materialPhoto.imageUrl,
          extractedText: materialPhoto.extractedText,
          Equipment: {
            type: materialPhoto.Equipment.type,
          },
        });
      }

      // Add control form details
      group.controlForms.push({
        id: controlForm.id,
        title: controlForm.title,
        value: controlForm.value,
        status: controlForm.status,
        date: controlForm.createdAt,
      });

      return acc;
    }, []);

    // Create a new workbook for Excel export
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Control Forms");

    // Define the header row
    worksheet.columns = [
      { header: "Extracted Text", key: "extractedText", width: 30 },
      { header: "User Email", key: "userEmail", width: 30 },
      { header: "Functional Photos", key: "functionalPhotos", width: 40 },
      { header: "Material Photos", key: "materialPhotos", width: 40 },
      { header: "Control Form ID", key: "controlFormId", width: 30 },
      { header: "Control Form Title", key: "controlFormTitle", width: 30 },
      { header: "Control Form Value", key: "controlFormValue", width: 20 },
      { header: "Control Form Status", key: "controlFormStatus", width: 20 },
      { header: "Control Form Date", key: "controlFormDate", width: 30 },
    ];

    // Add rows to the worksheet
    groupedData.forEach((group) => {
      const {
        extractedText,
        user,
        functionalPhotos,
        materialPhotos,
        controlForms,
      } = group;

      // Add each control form and related information
      controlForms.forEach((controlForm) => {
        const functionalPhotoUrls = functionalPhotos
          .map((photo) => photo.imageUrl)
          .join(", ");
        const materialPhotoUrls = materialPhotos
          .map((photo) => photo.imageUrl)
          .join(", ");

        worksheet.addRow({
          extractedText,
          userEmail: user.email,
          functionalPhotos: functionalPhotoUrls || "N/A",
          materialPhotos: materialPhotoUrls || "N/A",
          controlFormId: controlForm.id,
          controlFormTitle: controlForm.title,
          controlFormValue: controlForm.value,
          controlFormStatus: controlForm.status ? "Confirmed" : "Not Confirmed",
          controlFormDate: controlForm.date.toISOString(),
        });
      });
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=control_forms.xlsx"
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting control forms:", error);
    return res.status(500).json({
      status: 500,
      message: "Failed to export control forms. Please try again.",
    });
  }
};

export const bulkImportControlForms = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const { file } = req; // file is uploaded using multer

  try {
    // Load the Excel file
    await workbook.xlsx.load(file.buffer); // file.buffer for multer
    const worksheet = workbook.worksheets[0];

    const controlFormsData = [];

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const functionalPhotoId = row.getCell(1).value;
      const materialPhotoId = row.getCell(2).value;
      const extractedText = row.getCell(3).value;
      const title = row.getCell(4).value;
      const value = row.getCell(5).value;

      // Convert status to boolean
      const statusString = row.getCell(6).value;
      const status =
        statusString === "TRUE" || statusString === true ? true : false;

      controlFormsData.push({
        functionalPhotoId,
        materialPhotoId,
        extractedText,
        title,
        value,
        status,
      });
    });

    const results = [];
    const errors = [];

    await Promise.all(
      controlFormsData.map(async (data) => {
        // Check if functionalPhotoId and materialPhotoId exist
        const functionalPhotoExists = await prisma.functionalPhoto.findUnique({
          where: { id: data.functionalPhotoId },
        });

        const materialPhotoExists = await prisma.materialPhoto.findUnique({
          where: { id: data.materialPhotoId },
        });

        if (!functionalPhotoExists) {
          errors.push(`${data.functionalPhotoId} does not exist.`);
          return; // Skip to the next item
        }

        if (!materialPhotoExists) {
          errors.push(`${data.materialPhotoId} does not exist.`);
          return;
        }

        const existingControlForm = await prisma.controlFrom.findFirst({
          where: {
            functionalPhotoId: data.functionalPhotoId,
            materialPhotoId: data.materialPhotoId,
            extractedText: data.extractedText,
          },
        });

        const adminId = req.user?.id;
        console.log(existingControlForm, "existingControlForm");

        if (existingControlForm) {
          // Ensure the adminId exists before updating
          if (adminId) {
            const userExists = await prisma.admin.findUnique({
              where: { id: adminId },
            });

            if (!userExists) {
              errors.push(`User ID ${adminId} does not exist.`);
              return;
            }
          }

          const updatedForm = await prisma.controlFrom.update({
            where: { id: existingControlForm.id },
            data: {
              title: data.title,
              value: data.value,
              status: data.status,
              adminId: adminId,
            },
          });
          results.push(updatedForm);
        } else {
          // Ensure the userId exists before creating a new record
          if (adminId) {
            const userExists = await prisma.admin.findUnique({
              where: { id: adminId },
            });

            if (!userExists) {
              errors.push(`User ID ${adminId} does not exist.`);
              return; // Skip to the next item
            }
          }

          const createdForm = await prisma.controlFrom.create({
            data: {
              functionalPhotoId: data.functionalPhotoId,
              materialPhotoId: data.materialPhotoId,
              extractedText: data.extractedText,
              title: data.title,
              value: data.value,
              status: data.status,
              adminId: adminId,
            },
          });
          results.push(createdForm);
        }
      })
    );

    // Respond after all promises have resolved
    if (errors.length > 0) {
      console.log(errors, "errors occurred");
      return res.status(400).json({
        status: 400,
        message: "Some errors occurred during import.",
        errors: errors,
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Control forms imported/updated successfully.",
      data: results,
    });
  } catch (error) {
    console.error("Error importing control forms:", error);
    return res.status(500).json({
      status: 500,
      message: "Failed to import/update control forms. Please try again.",
    });
  }
};
