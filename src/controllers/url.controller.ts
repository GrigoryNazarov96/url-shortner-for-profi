import { Request, Response } from "express";
import Url, { IUrlShorten } from "../schema/url.schema";
import { ERROR } from "../constants";
import generateRandomSequence from "../utils/random_url_generator";
import isValidURL from "../utils/url_validator";
import generateProperURL from "../utils/proper_url_generator";
import { findRecord, createRecord, findRecordBySeq } from "../utils/handle_db_requests";
import isValidCustomSeq from "../utils/custom_seq_validator";

export const createShortenedURL = async (req: Request, res: Response): Promise<void> => {
  //retrieve the original url and the custom url (if exists) from the request
  const customSeq: string | undefined = req.body?.customSeq;
  let originalLink: string = req.body.originalLink;
  let record: IUrlShorten | null;
  try {
    if (!isValidURL(originalLink)) {
      throw new Error("Oops! You've provided not valid URL, check the input and try again");
    }
    if (customSeq && !isValidCustomSeq(customSeq)) {
      throw new Error(
        "Oops! Custom suffix you provided is not valid, check you've entered only latin letters, numbers and underscore"
      );
    }
    originalLink = generateProperURL(originalLink);
    const seq: string = customSeq ?? generateRandomSequence();
    //check existence
    record = await findRecord(originalLink, seq);
    //if doesn'f exists create one
    if (!record) {
      record = await createRecord(originalLink, seq);
    }
    res.status(200).send({ seq: record.seq });
  } catch (e: any) {
    if (e.code === ERROR.duplicate && customSeq) {
      res.status(400).send({ error: "Oops! This custom URL already exists, pick another one" });
    } else if (e.code === ERROR.duplicate && !customSeq) {
      res.status(500).send({ error: "Oops! Internal error, try again" });
    } else {
      res.status(500).send({ error: e.message });
    }
  }
};

export const redirectToOriginal = async (req: Request, res: Response): Promise<void> => {
  //retrieve the url from the request
  const seq = req.params?.code;

  const record = await findRecordBySeq(seq);
  if (record) {
    res.status(302).redirect(record.originalLink);
  } else {
    res.status(404).send({ error: "Oops! No URL was found" });
  }
};
