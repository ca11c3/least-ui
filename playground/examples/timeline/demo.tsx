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
  { title: "Order placed", time: "Oct 1, 09:12", text: "Payment confirmed by card ending 4242." },
  { title: "Packed", time: "Oct 2, 14:30", text: "Your items left the warehouse in one box." },
  { title: "Out for delivery", time: "Oct 4, 08:05", text: "The courier expects to arrive before 6 pm." },
];

export default function TimelineDemo() {
  return (
    <Timeline className="w-full max-w-md">
      {events.map((event) => (
        <TimelineItem key={event.title}>
          <TimelineIndicator />
          <TimelineContent>
            <TimelineHeader>
              <TimelineTitle>{event.title}</TimelineTitle>
              <TimelineTime>{event.time}</TimelineTime>
            </TimelineHeader>
            <TimelineDescription>{event.text}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
