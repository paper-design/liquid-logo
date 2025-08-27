export interface Logo {
  name: string;
  href: string;
  src: string;
  id: string;
}

export const logos = [
  [
    {
      name: 'Apple',
      href: '/',
      src: '/logos/apple.svg',
      id: '01JMFPY99JXXKRQWDAHBY0ARQH',
    },
    {
      name: 'Nike',
      href: '/share/01JMFN4FHEYQY3CBR7B4YBZFK9?edge=0.01',
      src: '/logos/nike.svg',
      id: '01JMFN4FHEYQY3CBR7B4YBZFK9',
    },
    {
      name: 'NASA',
      href: '/share/01JMFN7R2E6WV297MM6EHBCAW6?edge=0.15',
      src: '/logos/nasa.svg',
      id: '01JMFN7R2E6WV297MM6EHBCAW6',
    },
    {
      name: 'Chanel',
      href: '/share/01JMFNF83EX5DAVWF1TP1469BW?edge=0.15',
      src: '/logos/chanel.svg',
      id: '01JMFNF83EX5DAVWF1TP1469BW',
    },
    {
      name: 'Volkswagen',
      href: '/share/01JMFPD47QAN0FXMWWQC8YG8SY?edge=0.01',
      src: '/logos/volkswagen.svg',
      id: '01JMFPD47QAN0FXMWWQC8YG8SY',
    },
  ],
  [
    {
      name: 'Vercel',
      href: '/share/01JMFQ1ESB52205RRGSHCXHCZG?edgeBlur=0.01',
      src: '/logos/vercel.svg',
      id: '01JMFQ1ESB52205RRGSHCXHCZG',
    },
    {
      name: 'Discord',
      href: '/share/01JMFQS93Q6R2VRQ62HTAA2AKG',
      src: '/logos/discord.svg',
      id: '01JMFQS93Q6R2VRQ62HTAA2AKG',
    },
    {
      name: 'Paper',
      href: '/share/01JMP2MVEWNE5CZYXW94JQME35',
      src: '/logos/paper.svg',
      id: '01JMP2MVEWNE5CZYXW94JQME35',
    },
  ],
] as const satisfies Logo[][];
