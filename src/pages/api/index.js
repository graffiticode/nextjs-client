import express from "express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from "graphql-helix";
import {
  compiles,
  postCompile
} from "./resolvers.js";
import bent from "bent";
import { getBaseUrlForApi } from "../../lib/api";
import { client, getBaseUrlForAuth } from "../../lib/auth";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiUrl = process.env.NEXT_PUBLIC_GC_API_URL || "https://api.graffiticode.com";

const getApiJSON = bent(getBaseUrlForApi(), "GET", "json");

const postApiJSON = baseUrl => bent(baseUrl, "POST", "json", 200, 500);

const { GC_API_KEY_ID, GC_API_KEY_SECRET } = process.env;

const getAccessToken = async () => {
  console.log("GC_API_KEY_ID=" + GC_API_KEY_ID);
  const baseAuthUrl = getBaseUrlForAuth();
  // Exchange API key for auth token.
  const post = await postApiJSON(baseAuthUrl);
  const { data } = await post(
    `/v1/api-keys/${GC_API_KEY_ID}/authenticate`,
    { token: GC_API_KEY_SECRET },
    200, 401
  );
  console.log("getAccessToken() data=" + JSON.stringify(data));
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
  type Compile {
    id: String!
    timestamp: String!
    status: String!
    lang: String
  }
  type Data {
    val: String
    json: String
  }
  type Query {
    hello: String
    compiles(lang: String!, type: String!): [Compile!]
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
    compiles: async (_, args, ctx) => {
      const { token } = ctx;
      const { lang, type } = args;
      const { uid } = await client.verifyToken(token);
      return await compiles({ uid, accessToken: token, lang, type });
    },
  },
  Mutation: {
    compile: async (_, args, ctx) => {
      const { token } = ctx;
      const id = args.id;
      const data = JSON.parse(args.data);
      const { uid } = await client.verifyToken(token);
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
