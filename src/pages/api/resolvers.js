import bent from "bent";
import { getApiTask, getBaseUrlForApi } from "../../lib/api.js";

const getTask = async ({ auth, id }) => await getApiTask({ id, auth });

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");

export const postCompile = async ({ accessToken, id, data, ephemeral }) => {
  try {
    const baseApiUrl = getBaseUrlForApi();
    const headers = {
      authorization: accessToken,
      "x-graffiticode-storage-type": "persistent",
    };
    const post = bent(baseApiUrl, "POST", "json", headers);
    const body = { id, data };
    const resp = await post('/compile', body);
    if (resp.status !== "success") {
      throw new Error(`failed to post compile ${id}: ${error.message}`);
    }
    return resp.data;
  } catch (err) {
    throw err;
  }
};

export async function compiles({ uid, accessToken, lang, type }) {
  // const compilesDocs = await db.collection(`users/${auth.uid}/compiles`)
  //   .where('lang', '==', lang)
  //   .get();
  // const data = [];
  // compilesDocs.forEach(doc => {
  //   data.push(doc.data());
  // });
  // return data;
}
