import { compiler } from './compiler.js';
export default async function compileHandler(req, res) {
  const {
    method,
    body,
  } = req;
  const { code, data, config } = body;
  switch (method) {
  case 'POST':
    let body = req.body;
    let code = body.code || body.src;
    let data = body.data;
    let config = body.config || {};
    if (!code || !data) {
      return res.status(400).send();
    }
    if (code.root === undefined) {
      // [deprecated] Special case of code as data.
      return res.status(200).json(code);
    }
    await new Promise((resolve) =>
      compiler.compile(code, data, config, function (err, data) {
        if (err && err.length) {
          res.status(500).json({ error: err });
        } else {
          res.status(200).json(data);
        }
        resolve();
      })
    );
    break;
  default:
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
    break;
  }
}
