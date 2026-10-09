import { CheckIcon, GitMergeIcon, MessageSquareIcon, XIcon } from "lucide-react";
import {
  Timeline,
  TimelineContent,
  TimelineDescription,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "leastui";

const events = [
  { icon: MessageSquareIcon, color: undefined, title: "Review requested", time: "2h ago", text: "Ava asked Liam to review the change." },
  { icon: XIcon, color: "var(--destructive)", title: "Checks failed", time: "1h ago", text: "Typecheck failed on 2 files." },
  { icon: CheckIcon, color: "var(--success)", title: "Approved", time: "30m ago", text: "Liam approved the pull request." },
  { icon: GitMergeIcon, color: "rgb(147 51 234)", title: "Merged", time: "Just now", text: "Merged into main." },
];

export default function TimelineWithIcons() {
  return (
    <Timeline className="w-full max-w-md">
      {events.map(({ icon: Icon, color, title, time, text }) => (
        <TimelineItem key={title} color={color}>
          <TimelineIndicator>
            <Icon />
          </TimelineIndicator>
          <TimelineContent>
            <TimelineHeader>
              <TimelineTitle>{title}</TimelineTitle>
              <TimelineTime>{time}</TimelineTime>
            </TimelineHeader>
            <TimelineDescription>{text}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
