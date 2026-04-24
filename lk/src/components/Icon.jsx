import {

  Home,

  Book,

  Mic,

  CreditCard,

  Settings,

  User

} from 'lucide-react';

const icons = {

  home: Home,

  library: Book,

  voice: Mic,

  subscription: CreditCard,

  settings: Settings,

  profile: User,

};

export default function Icon({ name, size = 20 }) {

  const Component = icons[name];

  if (!Component) return null;

  return <Component size={size} strokeWidth={1.7} />;

}