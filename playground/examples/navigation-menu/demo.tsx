import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "leastui";

const components = [
  { title: "Alert Dialog", href: "#/docs/components/alert-dialog", text: "A modal that expects a response." },
  { title: "Date Picker", href: "#/docs/components/date-picker", text: "Typed date input with a calendar." },
  { title: "Table Grid", href: "#/docs/components/table-grid", text: "A grid table with a sticky header." },
  { title: "Tooltip", href: "#/docs/components/tooltip", text: "Information on hover or focus." },
];

export default function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-1">
              <li>
                <NavigationMenuLink href="#/docs">
                  <div className="font-medium">Introduction</div>
                  <p className="text-muted-foreground text-sm">What leastui is and what it includes.</p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#/docs/installation">
                  <div className="font-medium">Installation</div>
                  <p className="text-muted-foreground text-sm">Add it to a Tailwind v4 project.</p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-1 sm:grid-cols-2">
              {components.map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink href={item.href}>
                    <div className="font-medium">{item.title}</div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{item.text}</p>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <a href="#/docs/theming">Theming</a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
