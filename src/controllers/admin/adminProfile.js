// controllers/adminProfile.js
import { PrismaClient } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import moment from "moment";
import ResponseMessage from "../../utils/HTTPResponse.js";

const prisma = new PrismaClient();

export const updateAdminProfile = async (req, res) => {
  try {
    let updatedProfile = req.body;

    // Handle file upload logic if using a file middleware
    if (req?.files?.length > 0) {
      updatedProfile.image = req.files[0].filename;
    }

    let updateAdminProfile = await prisma.admin.update({
      where: { id: req.user.id },
      data: {
        name: updatedProfile.name,
        number: updatedProfile.number,
        image: updatedProfile.image,
        email: updatedProfile.email,
      },
    });

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.ADMIN_PROFILE_UPDATED,
      data: updateAdminProfile,
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
      data: err.message,
    });
  }
};

export const viewAdminProfile = async (req, res) => {
  try {
    const adminProfile = await prisma.admin.findUnique({
      where: { id: req.user.id },
    });

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.USER_PROFILE,
      data: adminProfile,
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
      data: err.message,
    });
  }
};


// export const dashboard = async (req, res) => {
//   try {
//     const { data } = req.body;
//     let startDate, endDate;

//     if (data === "year") {
//       startDate = moment().startOf('year').toDate();
//       endDate = moment().endOf('year').toDate();
//     } else if (data === "month") {
//       startDate = moment().startOf('month').toDate();
//       endDate = moment().endOf('month').toDate();
//     } else if (data === "week") {
//       startDate = moment().startOf('week').toDate();
//       endDate = moment().endOf('week').toDate();
//     } else {
//       startDate = moment().startOf('day').toDate();
//       endDate = moment().endOf('day').toDate();
//     }

//     const users = await User.find({
//       createdAt: { $gte: startDate, $lte: endDate },
//       isDeleted: false
//     });

//     // const businesses = await Business.find({
//     //   createdAt: { $gte: startDate, $lte: endDate },
//     //   isDeleted: false
//     // });

//     // const totalTransactions = await Transaction.find({
//     //   createdAt: { $gte: startDate, $lte: endDate },
//     //   status: "success"
//     // });

//     // const totalAmount = await Transaction.aggregate([
//     //   {
//     //     $match: {
//     //       status: "success",
//     //       createdAt: { $gte: startDate, $lte: endDate }
//     //     }
//     //   },
//     //   {
//     //     $group: {
//     //       _id: null,
//     //       totalAmount: {
//     //         $sum: { $toDouble: "$amount" }
//     //       }
//     //     }
//     //   }
//     // ]);

//     return Response(res, StatusCodes.OK, ResponseMessage.DASHBOARD_DETAILS, {
//       totalUsers: users.length,
//       // totalBusiness: businesses.length,
//       // totalTransactions: totalTransactions.length,
//       // totalAmount: totalAmount.length > 0 ? totalAmount[0].totalAmount.toString() : '0'
//     });
//   } catch (err) {
//     console.error(err.message);
//     return Response(res, StatusCodes.INTERNAL_SERVER_ERROR, ResponseMessage.INTERNAL_SERVER_ERROR);
//   }
// };


// Controller function to create a new equipment type
export const createEquipmentType = async (req, res) => {
  try {
    const { type } = req.body;

    // Validate the input
    if (!type) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: "Equipment type is required.",
      });
    }

    // Create a new equipment type in the database
    const newEquipment = await prisma.equipment.create({
      data: {
        type,
        // condition,
        // imageUrl,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: "Equipment type created successfully.",
      data: newEquipment,
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
// Controller function to get all equipment types
export const getEquipmentList = async (req, res) => {
  try {
    // Retrieve all equipment from the database
    const equipmentList = await prisma.equipment.findMany();

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: "Equipment list retrieved successfully.",
      data: equipmentList,
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

// Dashboard API

export const dashboard = async (req, res) => {
  try {
    // Query the total number of users created in the specified date range
    const totalUsers = await prisma.user.count({});

    const totalControlForm = await prisma.controlFrom.count({});

    const totalEquipment = await prisma.equipment.count({});

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.DASHBOARD_DETAILS,
      data: {
        totalUsers: totalUsers,
        totalControlForm: totalControlForm,
        totalEquipment: totalEquipment,
      },
    });
  } catch (err) {
    console.error(err.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
    });
  }
};
