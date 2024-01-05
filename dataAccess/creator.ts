import { MongoClient, ObjectId, ReturnDocument } from "mongodb";
import { mongoose } from "../config/mongodb";

const creator = {
  createCreator: async (creatorName: any) => {
    console.log("Inside createCreator", creatorName);
    const conn1 = mongoose.connection.collection("creators");
    const filter = {
      creatorName: creatorName,
    };

    const update = {
      $set: {
        dateUpdated: new Date().toISOString(),
      },
      $setOnInsert: {
        creatorName: creatorName,
        overallScore: 0,
        dateCreated: new Date().toISOString(),
        login_url: "",
      },
    };
    const options = {
      upsert: true,
      returnDocument: ReturnDocument.AFTER,
    };
    const result = await conn1.findOneAndUpdate(filter, update, options);
    console.log("result_creator", result.value?._id.toString());
    return result.value?._id.toString();
  },
  getCreator: async (creatorName: any) => {
    console.log("Inside getCreator", creatorName);
    const conn1 = mongoose.connection.collection("creators");
    const filter = {
      creatorName: creatorName,
    };
    const result = await conn1.findOne(filter);
    console.log("result", result);
    return result;
  },
  updateScore: async (creatorName: any, points: any) => {
    console.log("Inside updateScore", creatorName);
    const conn1 = mongoose.connection.collection("creators");
    const filter = {
      creatorName: creatorName,
    };

    const update = {
      $set: {
        dateUpdated: new Date().toISOString(),
        overallScore: points ?? 0,
      },
      $setOnInsert: {
        creatorName: creatorName,
        dateCreated: new Date().toISOString(),
        login_url: "",
      },
    };
    const options = {
      upsert: true,
      returnDocument: ReturnDocument.AFTER,
    };
    const result = await conn1.findOneAndUpdate(filter, update, options);
    console.log("result_creator", result.value?._id.toString());
    return result.value?._id.toString();
  },

  getAllCreators: async () => {
    console.log("Inside getAllCreators");
    const conn1 = mongoose.connection.collection("creators");
    const result = await conn1.find().toArray();
    if (result) {
      const creatorIds = result.map((creator: any) => creator._id.toString());
      console.log("creatorIds", creatorIds);
      return creatorIds;
    } else {
      return [];
    }

    return result;
  },
};

export default creator;
