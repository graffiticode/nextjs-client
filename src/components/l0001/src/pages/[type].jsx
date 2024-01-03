import { useState } from 'react';
//import { useRouter } from 'next/router';
import { compile } from '../swr/fetchers';
import useSWR from 'swr';
import { Form } from "../components/form";

const View = (props = {}) => {
//  const router = useRouter();
  const { access_token: accessToken, id } = /*router.query ||*/ props;
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
    recompile && accessToken && id && {
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
