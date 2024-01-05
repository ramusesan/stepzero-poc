import { MongoClient, ObjectId, ReturnDocument } from "mongodb";
import { mongoose } from "../config/mongodb";

const chartData = {
  getPostData: async (filter: any) => {
    const conn1 = mongoose.connection.collection("uploaded_post");
    const conn2 = mongoose.connection.collection("behaviour_points_earned");
    // const creatorId = "65804a5270f756ee68bb093b"; // Replace with the actual creatorId

    // const aggregationPipeline = [
    //     {
    //       $match: { creatorId: creatorId } // Match documents for the specific creator
    //     },
    //     {
    //       $lookup: {
    //         from: "behaviour_points_earned",
    //         let: { postIdString: { $toString: "$_id" } },  // Convert _id to string
    //         pipeline: [
    //           {
    //             $match: {
    //               $expr: {
    //                 $eq: ["$$postIdString", "$postId"]
    //               }
    //             }
    //           }
    //         ],
    //         as: "behaviour_points_earned"
    //       }
    //     },
    //     {
    //       $unwind: "$behaviour_points_earned" // Unwind the array for further processing
    //     },
    //     {
    //       $group: {
    //         _id: "$_id",
    //         uniqueBehaviours: { $addToSet: "$behaviour_points_earned.behaviourName" },
    //         pointsByType: {
    //           $push: {
    //             pointsType: "$behaviour_points_earned.pointsType",
    //             totalPoints: "$behaviour_points_earned.pointsEarned"
    //           }
    //         },
    //         totalPoints: { $sum: "$behaviour_points_earned.pointsEarned" },
    //         channel: { $first: "$channel" },
    //         creator: { $first: "$creator" },
    //         creatorId: { $first: "$creatorId" },
    //         dateCapturedISO: { $first: "$dateCapturedISO" },
    //         market: { $first: "$market" },
    //         CreativeXAssetID: { $first: "$CreativeXAssetID" },
    //         creativeXPostID: { $first: "$creativeXPostID" },
    //         postLink: { $first: "$postLink" },
    //         assetType: { $first: "$assetType" }
    //         // Add more fields as needed
    //       }
    //     },
    //     {
    //       $unwind: "$pointsByType" // Unwind the pointsByType array for further processing
    //     },
    //     {
    //       $group: {
    //         _id: {
    //           _id: "$_id",
    //           uniqueBehaviours: "$uniqueBehaviours",
    //           pointsType: "$pointsByType.pointsType"
    //         },
    //         totalPoints: { $sum: "$pointsByType.totalPoints" },
    //         channel: { $first: "$channel" },
    //         creator: { $first: "$creator" },
    //         creatorId: { $first: "$creatorId" },
    //         dateCapturedISO: { $first: "$dateCapturedISO" },
    //         market: { $first: "$market" },
    //         CreativeXAssetID: { $first: "$CreativeXAssetID" },
    //         creativeXPostID: { $first: "$creativeXPostID" },
    //         postLink: { $first: "$postLink" },
    //         assetType: { $first: "$assetType" }
    //         // Add more fields as needed
    //       }
    //     },
    //     {
    //       $group: {
    //         _id: "$_id._id",
    //         uniqueBehaviours: { $first: "$_id.uniqueBehaviours" },
    //         pointsByType: {
    //           $push: {
    //             pointsType: "$_id.pointsType",
    //             totalPoints: "$totalPoints"
    //           }
    //         },
    //         totalPoints: { $sum: "$totalPoints" },
    //         channel: { $first: "$channel" },
    //         creator: { $first: "$creator" },
    //         creatorId: { $first: "$creatorId" },
    //         dateCapturedISO: { $first: "$dateCapturedISO" },
    //         market: { $first: "$market" },
    //         CreativeXAssetID: { $first: "$CreativeXAssetID" },
    //         creativeXPostID: { $first: "$creativeXPostID" },
    //         postLink: { $first: "$postLink" },
    //         assetType: { $first: "$assetType" }
    //         // Add more fields as needed
    //       }
    //     },
    //     {
    //       $sort: { dateCapturedISO: -1 } // Sort posts in descending order of dateCapturedISO
    //     },
    //     {
    //       $project: {
    //         _id: 1,
    //         uniqueBehaviours: 1,
    //         pointsByType: 1,
    //         totalPoints: 1,
    //         channel: 1,
    //         creator: 1,
    //         creatorId: 1,
    //         dateCapturedISO: 1,
    //         market: 1,
    //         CreativeXAssetID: 1,
    //         creativeXPostID: 1,
    //         postLink: 1,
    //         assetType: 1
    //         // Add more fields as needed
    //       }
    //     }
    //   ];

    const staticPointsObject = {
      pointsType: "Engagement",
      totalPoints: 0,
    };

    const aggregationPipeline = [
      {
        $match: filter, // Match documents for the specific creator
      },
      {
        $lookup: {
          from: "behaviour_points_earned",
          let: { postIdString: { $toString: "$_id" } }, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$$postIdString", "$postId"],
                },
              },
            },
          ],
          as: "behaviour_points_earned",
        },
      },
      {
        $unwind: "$behaviour_points_earned", // Unwind the array for further processing
      },
      {
        $group: {
          _id: "$_id",
          uniqueBehaviours: { $addToSet: "$behaviour_points_earned.behaviourName" },
          pointsByType: {
            $push: {
              pointsType: "$behaviour_points_earned.pointsType",
              totalPoints: "$behaviour_points_earned.pointsEarned",
            },
          },
          totalPoints: { $sum: "$behaviour_points_earned.pointsEarned" },
          channel: { $first: "$channel" },
          creator: { $first: "$creator" },
          creatorId: { $first: "$creatorId" },
          dateCapturedISO: { $first: "$dateCapturedISO" },
          market: { $first: "$market" },
          CreativeXAssetID: { $first: "$CreativeXAssetID" },
          creativeXPostID: { $first: "$creativeXPostID" },
          postLink: { $first: "$postLink" },
          assetType: { $first: "$assetType" },
          thumbnailUrl: { $first: "$thumbnailUrl" },

          // Add more fields as needed
        },
      },
      {
        $addFields: {
          staticPointsObject: {
            $literal: [staticPointsObject], // Convert the static object to an array
          },
        },
      },
      {
        $project: {
          _id: 1,
          uniqueBehaviours: 1,
          pointsByType: {
            $concatArrays: ["$pointsByType", "$staticPointsObject"],
          },
          totalPoints: {
            $sum: {
              $concatArrays: ["$pointsByType.totalPoints", { $literal: [staticPointsObject.totalPoints] }],
            },
          },
          channel: 1,
          creator: 1,
          creatorId: 1,
          dateCapturedISO: 1,
          market: 1,
          CreativeXAssetID: 1,
          creativeXPostID: 1,
          postLink: 1,
          assetType: 1,
          thumbnailUrl: 1,
          // Add more fields as needed
        },
      },
      {
        $unwind: "$pointsByType", // Unwind the pointsByType array for further processing
      },
      {
        $group: {
          _id: {
            _id: "$_id",
            uniqueBehaviours: "$uniqueBehaviours",
            pointsType: "$pointsByType.pointsType",
          },
          totalPoints: { $sum: "$pointsByType.totalPoints" },
          channel: { $first: "$channel" },
          creator: { $first: "$creator" },
          creatorId: { $first: "$creatorId" },
          dateCapturedISO: { $first: "$dateCapturedISO" },
          market: { $first: "$market" },
          CreativeXAssetID: { $first: "$CreativeXAssetID" },
          creativeXPostID: { $first: "$creativeXPostID" },
          postLink: { $first: "$postLink" },
          assetType: { $first: "$assetType" },
          thumbnailUrl: { $first: "$thumbnailUrl" },
          // Add more fields as needed
        },
      },
      {
        $group: {
          _id: "$_id._id",
          uniqueBehaviours: { $first: "$_id.uniqueBehaviours" },
          pointsByType: {
            $push: {
              pointsType: "$_id.pointsType",
              totalPoints: "$totalPoints",
            },
          },
          totalPoints: { $sum: "$totalPoints" },
          channel: { $first: "$channel" },
          creator: { $first: "$creator" },
          creatorId: { $first: "$creatorId" },
          dateCapturedISO: { $first: "$dateCapturedISO" },
          market: { $first: "$market" },
          CreativeXAssetID: { $first: "$CreativeXAssetID" },
          creativeXPostID: { $first: "$creativeXPostID" },
          postLink: { $first: "$postLink" },
          assetType: { $first: "$assetType" },
          thumbnailUrl: { $first: "$thumbnailUrl" },
          // Add more fields as needed
        },
      },
      {
        $sort: { dateCapturedISO: -1 }, // Sort posts in descending order of dateCapturedISO
      },
      {
        $project: {
          _id: 1,
          uniqueBehaviours: 1,
          pointsByType: 1,
          totalPoints: 1,
          channel: 1,
          creator: 1,
          creatorId: 1,
          dateCapturedISO: 1,
          market: 1,
          CreativeXAssetID: 1,
          creativeXPostID: 1,
          postLink: 1,
          assetType: 1,
          thumbnailUrl: 1,
          // Add more fields as needed
        },
      },
    ];

    const result = await conn1.aggregate(aggregationPipeline).toArray();

    console.log("result", result);
    return result;
  },

  getOverallScore: async (filter: any) => {
    try {
      const conn1 = mongoose.connection.collection("creators");
      const monthlyCollection = mongoose.connection.collection("monthly_points_earned");
      const behaviourCollection = mongoose.connection.collection("behaviour_points_earned");
      console.log("filter", filter);
      const result = await conn1.findOne({ _id: new ObjectId(filter) });

      const monthlyPointsPipeline = [
        {
          $match: {
            creatorId: filter,
          },
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: "$pointsEarned" },
          },
        },
      ];

      const behaviourPointsPipeline = [
        {
          $match: {
            creatorId: filter,
          },
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: "$pointsEarned" },
          },
        },
      ];

      const [monthlyResult, behaviourResult] = await Promise.all([
        monthlyCollection.aggregate(monthlyPointsPipeline).toArray(),
        behaviourCollection.aggregate(behaviourPointsPipeline).toArray(),
      ]);

      const totalPoints = (monthlyResult[0]?.totalPoints || 0) + (behaviourResult[0]?.totalPoints || 0);
      if (result) result.overallScore = totalPoints;

      console.log("result", result);
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  getBehaviourOverviewChart: async (filter: any) => {
    const conn1 = mongoose.connection.collection("behaviour_points_earned");
    const aggregationPipeline = [
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$behaviourName",
          totalPoints: { $sum: "$pointsEarned" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id field from the output
          behaviourName: "$_id",
          totalPoints: 1,
        },
      },
      {
        $sort: {
          totalPoints: -1, // Sort in descending order of totalPoints
        },
      },
    ];
    const result = await conn1.aggregate(aggregationPipeline).toArray();
    console.log("result", result);
    return result;
  },

  getMonthlyBehaviourOverviewChart: async (filter: any) => {
    try {
      const conn1 = mongoose.connection.collection("behaviour_points_earned");
      // const endDate = new Date("2023-12-31T23:59:59.999Z").toISOString();
      // const startDate = new Date("2023-01-01T00:00:00.000Z").toISOString();
      const aggregationPipeline = [
        {
          $match: filter,
        },
        {
          $addFields: {
            month: { $month: { $toDate: "$dateCapturedISO" } },
          },
        },
        {
          $group: {
            _id: {
              name: "$behaviourName",
              month: "$month",
            },
            totalPoints: { $sum: "$pointsEarned" },
          },
        },
        {
          $group: {
            _id: "$_id.name",
            data: {
              $push: {
                k: "$_id.month",
                v: "$totalPoints",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            data: {
              $map: {
                input: { $range: [1, 13] },
                as: "m",
                in: {
                  $cond: {
                    if: { $in: ["$$m", "$data.k"] },
                    then: { $arrayElemAt: ["$data.v", { $indexOfArray: ["$data.k", "$$m"] }] },
                    else: 0,
                  },
                },
              },
            },
          },
        },
      ];
      const result = await conn1.aggregate(aggregationPipeline).toArray();
      console.log("result", result);
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  },

  getUploadedPostDetails: async (filter: any) => {
    const conn1 = mongoose.connection.collection("uploaded_post");
    const aggregationPipeline = [
      {
        $match: filter,
      },
    ];
    const result = await conn1.aggregate(aggregationPipeline).toArray();
    // console.log("result", result);
    return result;
  },

  getMonthlyBonusChart: async (filter: any) => {
    const conn1 = mongoose.connection.collection("monthly_points_earned");
    const aggregationPipeline = [
      {
        $match: filter,
      },
    ];
    const result = await conn1.aggregate(aggregationPipeline).toArray();
    console.log("result", result);
    return result;
  },
};
export default chartData;
