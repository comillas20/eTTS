import {
  BotIcon,
  FrameIcon,
  PieChartIcon,
  SquareTerminalIcon,
} from "lucide-react";

export const fakeUserData = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/images/Rina.png",
};

export const fakeWalletsData = [
  {
    id: 1,
    label: "G-cash",
    url: "#",
    icon: SquareTerminalIcon,
  },
  {
    id: 2,
    label: "Paymaya",
    url: "#",
    icon: BotIcon,
  },
];

export const fakeLinks = [
  {
    name: "e-Wallets",
    url: "#",
    icon: FrameIcon,
  },
  {
    name: "Settings",
    url: "#",
    icon: PieChartIcon,
  },
];
