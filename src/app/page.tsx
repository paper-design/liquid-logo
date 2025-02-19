import Page from '@/app/share/[id]/page';

const APPLE_LOGO_ID = '01JMFNDQBAHFZ0JS7AHRA5VYMT';

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
