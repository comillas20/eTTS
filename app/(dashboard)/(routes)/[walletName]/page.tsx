import { fakeWalletsData } from "../../data";
import { Datatable } from "./components/datatable";
import { getRecords } from "./data";

export async function generateStaticParams() {
  // const posts = await fetch("https://.../posts").then(res => res.json());

  return fakeWalletsData.map((data) => ({
    walletName: data.label.trim().replace(" ", "_"),
  }));
}

type PageProps = {
  params: Promise<{ walletName: string }>;
};

export default async function Page({ params }: PageProps) {
  const { walletName } = await params;
  const data = await getRecords();
  console.log(walletName);
  return <Datatable data={data} />;
}
