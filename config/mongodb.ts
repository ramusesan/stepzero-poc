import mongoose from "mongoose";
mongoose.set("strictQuery", false);

const mongoSetup = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const MONGO_HOST = `mongodb+srv://${process.env.MONGO_USERNAME ?? "ulstepzero"}:${process.env.MONGO_PASSWORD ?? "5C0kztWBOJwMTDEk"}@${process.env.CONNECTION_STRING ?? "stepzero0.0of4fdy.mongodb.net/?retryWrites=true&w=majority"}`;
    mongoose
      .connect(MONGO_HOST, { dbName: process.env.MONGO_DB??"StepZero" })
      .then(() => {
        console.debug(`Connected to MongoDB`);
        resolve();
      })
      .catch((err: Error) => {
        console.error(`Database connection error:`, err);
        reject(err);
      });   
    });                  
};
export { mongoSetup, mongoose };