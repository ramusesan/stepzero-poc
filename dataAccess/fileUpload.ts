import { MongoClient, ObjectId, ReturnDocument } from "mongodb";
import { mongoose } from "../config/mongodb";

const fileUpload = {
  // fileUpload: async (req: any, res: any) => {
  //   const conn1 = mongoose.connection.collection("uploaded_post");
  //   const data = req.body;
  //   // console.log(data);
  //   const result = await conn1.insertOne(data);
  //   //console.log("result", result);
  //   return { result };
  // },
  fileUpload: async (req: any, res: any) => {
    const conn1 = mongoose.connection.collection("uploaded_post");
    const filter = {
      CreativeXAssetID: req.body.CreativeXAssetID,
      creativeXPostID: req.body.creativeXPostID,
      creatorId: req.body.creatorId,
      dateCaptured: req.body.dateCaptured,
      postLink: req.body.postLink,
    };
    const update = {
      $set: {
        dateUpdated: new Date().toISOString(),
      },
      $setOnInsert: {
        ...req.body,
        dateCreated: new Date().toISOString(),
      },
    };
    const options = {
      upsert: true,
      returnDocument: ReturnDocument.AFTER,
    };

    const result = await conn1.findOneAndUpdate(filter, update, options);
    //console.log("result", result);
    return result;
  },
};

export default fileUpload;
