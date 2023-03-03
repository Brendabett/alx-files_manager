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
