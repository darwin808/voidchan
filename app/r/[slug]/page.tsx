import { Canvas } from "@/components/canvas/Canvas";

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;

  return <Canvas slug={slug} />;
}
