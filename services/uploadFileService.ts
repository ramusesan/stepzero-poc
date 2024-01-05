import fileUpload from "../dataAccess/fileUpload";
import chartData from "../dataAccess/chartData";
import { Request, Response } from "express";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import CamelCaseConverter from "../utility/camelCaseConverter";
import creator from "../dataAccess/creator";
import { camelCase } from "lodash";
import points from "../dataAccess/points";
import CommonUtility from "../utility/commonUtility";

const validFileformat = [".xlsx", ".xls", ".csv", ".xlsm"];
async function convertToISOString(dateString: any) {
  const currentYear = new Date().getFullYear();
  const [day, month] = dateString.split("-");

  const monthMap: { [key: string]: number } = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const monthIndex = monthMap[month];
  const dateObject = new Date(currentYear, monthIndex, parseInt(day));

  if (!isNaN(dateObject.getTime())) {
    return dateObject.toISOString();
  } else {
    console.error("Invalid date");
    return null;
  }
}
async function getThumbnailUrl(videoUrl: string) {
  try {
    const youtubeThumbnail = require("youtube-thumbnail");
    const videoId = videoUrl.split("v=")[1];
    const thumbnail = youtubeThumbnail(videoId);
    console.log(thumbnail);
    return thumbnail.high.url;
  } catch (err) {
    console.log("error in getting thumbnail url", err);
    return null;
  }
}
const uploadFileService = {
  fileUpload: async (req: Request, res: Response) => {
    console.log("fileUpload", req.body);
    if (!req.file) {
      res.status(400).send({
        message: "No file uploaded.",
        status: false,
      });
      return;
    }
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    const fileSizeinMB = fileSizeInKB / 1024;
    let fileStatus = "pending";

    console.log("File Size:", fileSizeInKB, "KB");
    console.log("File Size:", fileSizeinMB, "MB");
    const fileFormat = path.extname(filePath).toLowerCase();
    console.log("File Format:", fileFormat);
    if (!validFileformat.includes(fileFormat)) {
      res.status(400).send({
        message: "File format should be xlsx, xls, csv or xlsm",
        status: false,
      });
      return;
    }
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert the worksheet to JSON
    const dateFormat = "dd/mm/yyyy";
    const data: any = await XLSX.utils.sheet_to_json(worksheet, {
      header: 0,
      raw: false,
      dateNF: dateFormat,
    });
    if (data.length > 0) {
      const camelCaseArray = await Promise.all(data.map(async (obj: any) => await CamelCaseConverter.keysToCamelCase(obj)));
      //console.log(camelCaseArray);
      const behaviourPoints = await points.getBehvaiourPoints({});
      const bonusPoints = await points.getBonusPoints({ pointsType: "Creative Quality", status: "Active" });
      // check users entry in database
      for (const post of camelCaseArray) {
        const creatorName = post.creator;
        console.log("creatorName", creatorName);
        const creatorId = await creator.createCreator(creatorName);
        console.log("creatorId", creatorId);
        post.creatorId = creatorId;
        const dateCaptured = await convertToISOString(post.dateCaptured);
        post.dateCapturedISO = dateCaptured;
        if (post.channel === "YouTube" || post.channel === "Youtube") {
          const thumbnailUrl = await getThumbnailUrl(post.postLink);
          post.thumbnailUrl = thumbnailUrl;
        } else {
          post.thumbnailUrl = null;
        }
        const parsedData = JSON.parse(JSON.stringify(post));
        req.body = parsedData;
        const fileUploadResult = await fileUpload.fileUpload(req, res);
        console.log("fileUploadResult", fileUploadResult.value?._id.toString());
        req.body.postId = fileUploadResult.value?._id.toString();
        var scoreToAdd = 0;

        for (let i = 1; i <= 6; i++) {
          console.log(i);
          if (
            post[`behaviour${i}PresentInAudio`] === "Yes" ||
            post[`behaviour${i}PresentInCaptions`] === "Yes" ||
            post[`behaviour${i}IntegrationInFirst5Seconds`] === "Yes"
          ) {
            const behaviorEntry = behaviourPoints.find((point: any) => point.indexPosition === i);
            console.log("behaviorEntry", behaviorEntry);
            if (behaviorEntry) {
              const pointsEarned = behaviorEntry.points;
              const pointsTitle = "Behaviour mention in post";
              const pointsType = "Behaviour Mentioned";
              const behaviourPointsData = {
                postId: req.body.postId,
                creatorId: req.body.creatorId,
                behaviourName: behaviorEntry.creatorCategory,
                pointsType: pointsType,
                pointsTitle: pointsTitle,
                pointsEarned: pointsEarned,
                postLink: req.body.postLink,
                market: req.body.market,
                dateCapturedISO: req.body.dateCapturedISO,
                channel: req.body.channel,
              };
              scoreToAdd = scoreToAdd + pointsEarned;
              const pointsResult = await points.addPoints(behaviourPointsData);
              console.log("pointsResult", pointsResult);
            }
          }

          if (post[`behaviour${i}PresentInAudio`] === "Yes") {
            const behaviorEntry1 = behaviourPoints.find((point: any) => point.indexPosition === i);
            const behaviorEntry = bonusPoints.find((point: any) => point.pointsTitle === "Behaviour mention in audio");
            console.log("behaviorEntry", behaviorEntry);
            if (behaviorEntry && behaviorEntry1) {
              const pointsEarned = behaviorEntry.points;
              const pointsTitle = behaviorEntry.pointsTitle;
              const pointsType = behaviorEntry.pointsType;
              const behaviourPointsData = {
                postId: req.body.postId,
                creatorId: req.body.creatorId,
                behaviourName: behaviorEntry1.creatorCategory,
                pointsType: pointsType,
                pointsTitle: pointsTitle,
                pointsEarned: pointsEarned,
                postLink: req.body.postLink,
                market: req.body.market,
                dateCapturedISO: req.body.dateCapturedISO,
                channel: req.body.channel,
              };
              scoreToAdd = scoreToAdd + pointsEarned;
              const pointsResult = await points.addPoints(behaviourPointsData);
              console.log("pointsResult", pointsResult);
            }
          }

          if (post[`behaviour${i}PresentInCaptions`] === "Yes") {
            const behaviorEntry1 = behaviourPoints.find((point: any) => point.indexPosition === i);
            const behaviorEntry = bonusPoints.find((point: any) => point.pointsTitle === "Behaviour mention in Captions");
            console.log("behaviorEntry", behaviorEntry);
            if (behaviorEntry && behaviorEntry1) {
              const pointsEarned = behaviorEntry.points;
              const pointsTitle = behaviorEntry.pointsTitle;
              const pointsType = behaviorEntry.pointsType;
              const behaviourPointsData = {
                postId: req.body.postId,
                creatorId: req.body.creatorId,
                behaviourName: behaviorEntry1.creatorCategory,
                pointsType: pointsType,
                pointsTitle: pointsTitle,
                pointsEarned: pointsEarned,
                postLink: req.body.postLink,
                market: req.body.market,
                dateCapturedISO: req.body.dateCapturedISO,
                channel: req.body.channel,
              };
              scoreToAdd = scoreToAdd + pointsEarned;
              const pointsResult = await points.addPoints(behaviourPointsData);
              console.log("pointsResult", pointsResult);
            }
          }
          //behaviourIntegrationInFirst5Seconds
          if (post[`behaviour${i}IntegrationInFirst5Seconds`] === "Yes") {
            const behaviorEntry1 = behaviourPoints.find((point: any) => point.indexPosition === i);
            const behaviorEntry = bonusPoints.find((point: any) => point.pointsTitle === "Mention in 1st 5s");
            console.log("behaviorEntry", behaviorEntry);
            if (behaviorEntry && behaviorEntry1) {
              const pointsEarned = behaviorEntry.points;
              const pointsTitle = behaviorEntry.pointsTitle;
              const pointsType = behaviorEntry.pointsType;
              const behaviourPointsData = {
                postId: req.body.postId,
                creatorId: req.body.creatorId,
                behaviourName: behaviorEntry1.creatorCategory,
                pointsType: pointsType,
                pointsTitle: pointsTitle,
                pointsEarned: pointsEarned,
                postLink: req.body.postLink,
                market: req.body.market,
                dateCapturedISO: req.body.dateCapturedISO,
                channel: req.body.channel,
              };
              scoreToAdd = scoreToAdd + pointsEarned;
              const pointsResult = await points.addPoints(behaviourPointsData);
              console.log("pointsResult", pointsResult);
            }
          }
        }

        //add in total points
        console.log("scoreToAdd", scoreToAdd);
        const cratorData = await creator.getCreator(creatorName);
        console.log("cratorData", cratorData);
        if (cratorData) {
          const creatorPoints = cratorData.overallScore;
          scoreToAdd = scoreToAdd + creatorPoints;
          console.log("scoreToAdd", scoreToAdd);
          const creatorResult = await creator.updateScore(creatorName, scoreToAdd);
          console.log("creatorResult", creatorResult);
        }
      }
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting the local file:", err);
        } else {
          console.log("Local file deleted.");
        }
      });
      res.status(200).send({ status: "success", message: "File uploaded successfully" });
    }
  },
  getPosts: async (req: Request, res: Response) => {
    try {
      const filter = {
        creatorId: req.body.creatorId,
      };
      const postResult = await chartData.getPostData(filter);
      res.status(200).send({ status: "success", message: "Data fetched", data: postResult });
    } catch (err) {
      console.log("error in fetching post data");
      res.status(500).send({ status: "failure", message: "Error while fetching post data !" });
    }
  },
  getOverallScore: async (req: Request, res: Response) => {
    try {
      const filter = req.body.creatorId;
      const postResult = await chartData.getOverallScore(filter);
      res.status(200).send({ status: "success", message: "Data fetched", data: postResult });
    } catch (err) {
      console.log("error in fetching post data");
      res.status(500).send({ status: "failure", message: "Error while fetching post data !" });
    }
  },
  getBehaviourOverviewChart: async (req: Request, res: Response) => {
    try {
      const filter = {
        creatorId: req.body.creatorId,
        behaviourName: { $ne: "Behaviour Integration in first 5 seconds" },
      };
      const postResult = await chartData.getBehaviourOverviewChart(filter);
      res.status(200).send({ status: "success", message: "Data fetched", data: postResult });
    } catch (err) {
      console.log("error in fetching post data");
      res.status(500).send({ status: "failure", message: "Error while fetching post data !" });
    }
  },

  getMonthlyBehaviourOverviewChart: async (req: Request, res: Response) => {
    try {
      const filter = {
        creatorId: req.body.creatorId,
        behaviourName: { $ne: "Behaviour Integration in first 5 seconds" },
      };
      const postResult = await chartData.getMonthlyBehaviourOverviewChart(filter);
      res.status(200).send({ status: "success", message: "Data fetched", data: postResult });
    } catch (err) {
      console.log("error in fetching post data");
      res.status(500).send({ status: "failure", message: "Error while fetching post data !" });
    }
  },

  calculateMonthlyBonusChart: async (req: Request, res: Response) => {
    try {
      const { firstDay, lastDay } = await CommonUtility.getFirstAndLastDayOfLastMonth();
      console.log("firstDay", firstDay);
      console.log("lastDay", lastDay);

      const dateObject = new Date(firstDay);

      const year = dateObject.getFullYear();
      const month = dateObject.getMonth() + 1; // Months are zero-based, so add 1
      const day = dateObject.getDate();

      console.log(`Year: ${year}, Month: ${month}, Day: ${day}`);
      const filter = {
        creatorId: req.body.creatorId,
        dateCapturedISO: {
          $gte: firstDay,
          $lte: lastDay,
        },
      };
      const postResult = await chartData.getUploadedPostDetails(filter);
      if (postResult.length > 0) {
        console.log("postResult", postResult.length);
        const numberOfPosts = postResult.length;
        var behaviour1Points = 0;
        var behaviour2Points = 0;
        var behaviour3Points = 0;
        var behaviour4Points = 0;
        var behaviour5Points = 0;
        var behaviour6Points = 0;
        var numberOfPostsWithAtLeastOneBehaviourPresent = 0;
        for (const post of postResult) {
          var atLeastOneBehaviourPresent = false;
          if (
            post.behaviour1IntegrationInFirst5Seconds === "Yes" ||
            post.behaviour1PresentInAudio === "Yes" ||
            post.behaviour1PresentInCaptions === "Yes"
          ) {
            behaviour1Points = behaviour1Points + 1;
            atLeastOneBehaviourPresent = true;
          }
          if (
            post.behaviour2IntegrationInFirst5Seconds === "Yes" ||
            post.behaviour2PresentInAudio === "Yes" ||
            post.behaviour2PresentInCaptions === "Yes"
          ) {
            behaviour2Points = behaviour2Points + 1;
            atLeastOneBehaviourPresent = true;
          }
          if (
            post.behaviour3IntegrationInFirst5Seconds === "Yes" ||
            post.behaviour3PresentInAudio === "Yes" ||
            post.behaviour3PresentInCaptions === "Yes"
          ) {
            behaviour3Points = behaviour3Points + 1;
            atLeastOneBehaviourPresent = true;
          }
          if (
            post.behaviour4IntegrationInFirst5Seconds === "Yes" ||
            post.behaviour4PresentInAudio === "Yes" ||
            post.behaviour4PresentInCaptions === "Yes"
          ) {
            behaviour4Points = behaviour4Points + 1;
            atLeastOneBehaviourPresent = true;
          }
          if (
            post.behaviour5IntegrationInFirst5Seconds === "Yes" ||
            post.behaviour5PresentInAudio === "Yes" ||
            post.behaviour5PresentInCaptions === "Yes"
          ) {
            behaviour5Points = behaviour5Points + 1;
            atLeastOneBehaviourPresent = true;
          }
          if (
            post.behaviour6IntegrationInFirst5Seconds === "Yes" ||
            post.behaviour6PresentInAudio === "Yes" ||
            post.behaviour6PresentInCaptions === "Yes"
          ) {
            behaviour6Points = behaviour6Points + 1;
            atLeastOneBehaviourPresent = true;
          }
          if (atLeastOneBehaviourPresent) {
            numberOfPostsWithAtLeastOneBehaviourPresent = numberOfPostsWithAtLeastOneBehaviourPresent + 1;
          }
        }
        const behaviour1Percentage = (behaviour1Points / numberOfPosts) * 100;
        const behaviour2Percentage = (behaviour2Points / numberOfPosts) * 100;
        const behaviour3Percentage = (behaviour3Points / numberOfPosts) * 100;
        const behaviour4Percentage = (behaviour4Points / numberOfPosts) * 100;
        const behaviour5Percentage = (behaviour5Points / numberOfPosts) * 100;
        const behaviour6Percentage = (behaviour6Points / numberOfPosts) * 100;
        const atLeastOneBehaviourPresentPercentage = (numberOfPostsWithAtLeastOneBehaviourPresent / numberOfPosts) * 100;

        const bonusPoints = await points.getBonusPoints({ pointsType: "Monthly Bonus points", status: "Active" });
        const seventyPercentBonusPoints = bonusPoints.find((point: any) => point.pointsTitle === "70% Posts mentioning specific behaviour");
        const fiftyPercentBonusPoints = bonusPoints.find((point: any) => point.pointsTitle === "50% of posts mentioning specific behaviour");
        const atLeastOneBehaviourPresentBonusPoints1 = bonusPoints.find((point: any) => point.pointsTitle === "70% Posts mentioning any behaviour");
        const atLeastOneBehaviourPresentBonusPoints2 = bonusPoints.find((point: any) => point.pointsTitle === "50% Posts mentioning any behaviour");

        for (let i = 1; i <= 6; i++) {
          const currentBehaviourPercentage = eval(`behaviour${i}Percentage`);

          if (currentBehaviourPercentage >= 70) {
            console.log(`Behaviour ${i} is greater than or equal to 70%`);
            const pointsToInsert={
              postId: req.body.postId,
              creatorId: req.body.creatorId,
              behaviourName: `Behaviour ${i}`,
              pointsType: "Monthly Bonus points",
              pointsTitle: `70% of Your Posts mentioned "Behaviour${i}"`,
              pointsEarned: seventyPercentBonusPoints?.points??0,
              pointsMonth: month,
              pointsYear: year,

            }
            const pointsResult = await points.addMonthlyPoints(pointsToInsert);
          } else if (currentBehaviourPercentage >= 50) {
            console.log(`Behaviour ${i} is greater than or equal to 50%`);
            const pointsToInsert={
              postId: req.body.postId,
              creatorId: req.body.creatorId,
              behaviourName: `Behaviour ${i}`,
              pointsType: "Monthly Bonus points",
              pointsTitle: `50% of Your Posts mentioned "Behaviour${i}"`,
              pointsEarned: fiftyPercentBonusPoints?.points??0,
              pointsMonth: month,
              pointsYear: year,

            }
            const pointsResult = await points.addMonthlyPoints(pointsToInsert);
          }
        }
        if(atLeastOneBehaviourPresentPercentage >= 70){
          const pointsToInsert={
            postId: req.body.postId,
            creatorId: req.body.creatorId,
            behaviourName: `NA`,
            pointsType: "Monthly Bonus points",
            pointsTitle: `70% of Your Posts mentioned any behaviour`,
            pointsEarned: atLeastOneBehaviourPresentBonusPoints1?.points??0,
            pointsMonth: month,
            pointsYear: year,

          }
          const pointsResult = await points.addMonthlyPoints(pointsToInsert);
        }
          else if(atLeastOneBehaviourPresentPercentage >= 50){
            const pointsToInsert={
              postId: req.body.postId,
              creatorId: req.body.creatorId,
              behaviourName: `NA`,
              pointsType: "Monthly Bonus points",
              pointsTitle: `50% of Your Posts mentioned any behaviour`,
              pointsEarned: atLeastOneBehaviourPresentBonusPoints2?.points??0,
              pointsMonth: month,
              pointsYear: year,

            }
            const pointsResult = await points.addMonthlyPoints(pointsToInsert);
          }
          res.status(200).send({ status: "success", message: "Data fetched", data: postResult });
      }
      else{
        res.status(200).send({ status: "success", message: "No Data found !", data: postResult });
      }
    
    } catch (err) {
      console.log("error in fetching post data");
      res.status(500).send({ status: "failure", message: "Error while fetching post data !" });
    }
  },

  getMonthlyBonusChart: async (req: Request, res: Response) => {
    try {
      const { firstDay, lastDay } = await CommonUtility.getFirstAndLastDayOfLastMonth();
      console.log("firstDay", firstDay);
      console.log("lastDay", lastDay);

      const dateObject = new Date(firstDay);

      const year = dateObject.getFullYear();
      const month = dateObject.getMonth() + 1; // Months are zero-based, so add 1
      const day = dateObject.getDate();

      console.log(`Year: ${year}, Month: ${month}, Day: ${day}`);
      const filter = {
        creatorId: req.body.creatorId,
        pointsMonth: month,
        pointsYear: year,
      };
      const postResult = await chartData.getMonthlyBonusChart(filter);
      res.status(200).send({ status: "success", message: "Data fetched", data: postResult });
    } catch (err) {
      console.log("error in fetching post data");
      res.status(500).send({ status: "failure", message: "Error while fetching post data !" });
    }
  },

  getAllCreators: async (req: Request, res: Response) => {
    try {
      const postResult = await creator.getAllCreators();
      res.status(200).send({ status: "success", message: "Data fetched", data: postResult });
    } catch (err) {
      console.log("error in fetching post data");
      res.status(500).send({ status: "failure", message: "Error while fetching post data !" });
    }
  },

};

export default uploadFileService;
