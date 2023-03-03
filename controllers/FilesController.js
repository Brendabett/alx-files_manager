/* eslint-disable no-param-reassign */
import { contentType } from 'mime-types';
import dbClient from '../utils/db';
import UtilController from './UtilController';

export default class FilesController {
  static async postUpload(request, response) {
    const userId = request.user.id;
    const {
      name, type, parentId, isPublic, data,
    } = request.body;
    if (!name || !type || (![folder, file, image].includes(type)) || (!data && type !== folder)) {
      // eslint-disable-next-line no-nested-ternary
      response.status(400).send(`error: ${!name ? Missing name : (!type || (![folder, file, image].includes(type)))
        ? Missing type : Missing data}`);
