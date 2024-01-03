import React, { useState, useEffect } from 'react';

function isNonNullNonEmptyObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null &&
      Object.keys(obj).length > 0
  );
}

function renderJSON(data, depth = 0) {
  return (
    <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
  );
}

function render({state}) {
  const { data } = state;
  if (!isNonNullNonEmptyObject(data)) {
    return <div />;
  } else if (data.val) {
    return data.val;
  } else {
    return renderJSON(data);
  }
}

export const Form = ({ state }) => {
  return (
    <div className="bg-gray-100 p-2">
      { render({state}) }
    </div>
  );
}
