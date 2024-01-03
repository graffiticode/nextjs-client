import express from "express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from "graphql-helix";
import { postCompile } from "./resolvers.js";
import bent from "bent";
import { client } from "../../lib/auth";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const baseAuthUrl = "https://auth.graffiticode.org";
const baseApiUrl = "https://api.graffiticode.org";
//const baseAuthUrl = "http://localhost:4100";
//const baseApiUrl = "http://localhost:3100";

const apiUrl = process.env.NEXT_PUBLIC_GC_API_URL || "https://api.graffiticode.com";

const getApiJSON = bent(apiUrl, "GET", "json");

const postApiJSON = baseUrl => bent(baseUrl, "POST", "json", 200, 500);

const { GC_API_KEY_ID, GC_API_KEY_SECRET } = process.env;

const getAccessToken = async () => {
  console.log("GC_API_KEY_ID=" + GC_API_KEY_ID);
  // Exchange API key for auth token.
  const post = await postApiJSON(baseAuthUrl);
  const { data } = await post(
    `/v1/api-keys/${GC_API_KEY_ID}/authenticate`,
    { token: GC_API_KEY_SECRET },
    200, 401
  );
  if (data) {
    const { accessToken } = data;
    return accessToken;
  } else {
    return null;
  }
};

const getApiData = async ({ accessToken, id }) => {
  try {
    const headers = { "Authorization": accessToken };
    const { status, error, data } = await getApiJSON(`/data?id=${id}`, null, headers);
    if (status !== "success") {
      throw new Error(`failed to get task ${id}: ${error.message}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
};

const typeDefs = `
  type Data {
    solution: String
    projectionName: String
  }
  type Query {
    hello: String
  }
  type Mutation {
    compile(id: String!, data: String!, ephemeral: Boolean): Data
  }
`;

const resolvers = {
  Query: {
    hello: () => {
      return "hello, world!"
    },
  },
  Mutation: {
    compile: async (_, args, ctx) => {
      const { token } = ctx;
      const id = args.id;
      const data = JSON.parse(args.data);
      const { uid } = await client.verifyToken(token);
      console.log("compile() uid=" + uid); 
      const resp = await postCompile({ accessToken: token, id, data });
      return resp;
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default async function handler(req, res) {
  const request = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
  };
  if (shouldRenderGraphiQL(request)) {
    const html = renderGraphiQL({
      endpoint: "/api",
//      headers: `{ "authorization": "${accessToken}" }`,
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    const accessToken = await getAccessToken();
    const { operationName, query, variables } = getGraphQLParameters(request);
    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
      contextFactory: () => ({
        token: accessToken,
      }),
    });
    sendResult(result, res);
  }
}
