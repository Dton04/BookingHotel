import React from 'react';
import { HashLoader } from 'react-spinners';
import { CSSProperties } from 'react';

const override = {
  display: 'block',
  margin: '0 auto',
  borderColor: 'red',
};

function Loader({ loading = true }) {
  return (
    <div
      className="sweet-loading text-center"
      style={{
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loading ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <HashLoader
        color="#007bff"
        loading={loading}
        cssOverride={override}
        size={80}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  );
}

export default Loader;