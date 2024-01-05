'use client'
import { useState } from 'react';
import { compile } from '../swr/fetchers';
import useSWR from 'swr';
import { Form } from "../components/l0001/src/components/form";

const View = (props) => {
  const { access_token: accessToken, id } = /*router.query ||*/ {id: "eyJ0YXNrSWRzIjpbInlBUWJPT2YwZlhuVTBDRlh2TkhlIl19"} //props;
  const [ recompile, setRecompile ] = useState(true);
  const createState = (data, reducer) => {
    return {
      apply(action) {
        data = reducer(data, action);
      },
      get data() {
        return data
      },
    };
  };

  const [ state ] = useState(createState({}, (data, { type, args }) => {
    switch (type) {
    case "compiled":
      return {
        ...data,
        ...args,
      };
    case "change":
      setRecompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  console.log("View() recompile=" + recompile + " id=" + id);

  const resp = useSWR(
    recompile && id && {
      accessToken,
      id,
      data: state.data,
    },
    compile
  );

  console.log("View() resp=" + JSON.stringify(resp, null, 2));

  if (resp.data) {
    state.apply({
      type: "compiled",
      args: resp.data,
    });
    setRecompile(false);
  }

  return (
    <Form state={state} />
  );
}

export default View;
