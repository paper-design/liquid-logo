import React from 'react';
import { ClipLoader } from 'react-spinners';


function Spinner({ size = 16 }: { size?: number }) {
    return (
        <div className='h-full flex justify-center items-center'>
            <ClipLoader
                color="white"
                size={size}
            />
        </div>
    );
}

export default React.memo(Spinner);