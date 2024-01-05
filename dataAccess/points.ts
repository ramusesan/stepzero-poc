import { MongoClient, ObjectId,ReturnDocument } from "mongodb";
import { mongoose } from "../config/mongodb";

const points = {
    getBehvaiourPoints:async(filter:any)=>{
        const conn1 = mongoose.connection.collection("basic_behaviour_points");
        const result = await conn1.find(filter).toArray();
        return result;
    },
    getBonusPoints:async(filter:any)=>{
        const conn1 = mongoose.connection.collection("bonus_monthly_points");
        const result = await conn1.find(filter).toArray();
        return result;

    },
    addPoints:async(points:any)=>{
        const conn1 = mongoose.connection.collection("behaviour_points_earned");
        const filter = {
            postId: points.postId,
            creatorId: points.creatorId,
            behaviourName: points.behaviourName,
            pointsType: points.pointsType,
            pointsTitle: points.pointsTitle,
        }
        const update = {
            $set: {
              pointsEarned:points.pointsEarned,
              postLink:points.postLink,
              market:points.market,
              dateCapturedISO:points.dateCapturedISO,
              dateUpdated: new Date().toISOString(),
            },
            $setOnInsert: {
                postId: points.postId,
                creatorId: points.creatorId,
                behaviourName: points.behaviourName,
                pointsType: points.pointsType,
                pointsTitle: points.pointsTitle,
                channel:points.channel,
                dateCreated: new Date().toISOString(),
            },
          };
          const options = {
            upsert: true,
            returnDocument: ReturnDocument.AFTER,
          };
          const result = await conn1.findOneAndUpdate(filter, update, options);
          console.log("result",result);
          return result;
    },

    addMonthlyPoints:async(points:any)=>{
        const conn1 = mongoose.connection.collection("monthly_points_earned");
        const filter = {
            creatorId: points.creatorId,
            pointsType: points.pointsType,
            pointsTitle: points.pointsTitle,
            pointsMonth: points.pointsMonth,
            pointsYear: points.pointsYear,
        }
        const update = {
            $set: {
              pointsEarned:points.pointsEarned,
              dateUpdated: new Date().toISOString(),
            },
            $setOnInsert: {
                creatorId: points.creatorId,
                pointsType: points.pointsType,
                pointsTitle: points.pointsTitle,
                pointsMonth: points.pointsMonth,
                pointsYear: points.pointsYear,
                dateCreated: new Date().toISOString(),
            },
          };
          const options = {
            upsert: true,
            returnDocument: ReturnDocument.AFTER,
          };
          const result = await conn1.findOneAndUpdate(filter, update, options);
          console.log("result",result);
          return result;
    }

}

export default points;