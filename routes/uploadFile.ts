import express from "express"
import uploadFileService from "../services/uploadFileService";


const uploadFileRouter = express.Router();

uploadFileRouter.post('/', uploadFileService.fileUpload);
uploadFileRouter.post('/getPostDetails',uploadFileService.getPosts);
uploadFileRouter.post('/getOverallScore',uploadFileService.getOverallScore);
uploadFileRouter.post('/getBehaviourOverviewChart',uploadFileService.getBehaviourOverviewChart);
uploadFileRouter.post('/getMonthlyBehaviourOverviewChart',uploadFileService.getMonthlyBehaviourOverviewChart);
uploadFileRouter.post('/calculateMonthlyBonusChart',uploadFileService.calculateMonthlyBonusChart);
uploadFileRouter.post('/getMonthlyBonusChart',uploadFileService.getMonthlyBonusChart);
uploadFileRouter.get('/getAllCreators',uploadFileService.getAllCreators);

export default uploadFileRouter;