import Page from '@/app/share/[id]/page';


 
const APPLE_LOGO_ID = '01JMFPY99JXXKRQWDAHBY0ARQH';
 
export default function Home() {
 

  return (
 

    <Page
 

      params={
 

        new Promise((resolve) =>
 

          resolve({
 

            id: APPLE_LOGO_ID,
 

          })
 

        )
	  }
	 />
	 );
}