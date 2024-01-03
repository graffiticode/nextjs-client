import bent from "bent";
import { getApiTask, getBaseUrlForApi } from "../../lib/api.js";

const getTask = async ({ auth, id }) => await getApiTask({ id, auth });

const postApiJSON = bent(getBaseUrlForApi(), "POST", "json");
const baseApiUrl = "https://api.graffiticode.org";

export const postCompile = async ({ accessToken, id, data, ephemeral }) => {
  try {
    const headers = {
      authorization: accessToken,
      "x-graffiticode-storage-type": "persistent",
    };
    const post = bent(baseApiUrl, "POST", "json", headers);
    const body = { id, data };
    const resp = await post('/compile', body);
    console.log("postCompile() resp=" + JSON.stringify(resp, null, 2));
    if (resp.status !== "success") {
      throw new Error(`failed to post compile ${id}: ${error.message}`);
    }
    return resp.data;
  } catch (err) {
    throw err;
  }
};
