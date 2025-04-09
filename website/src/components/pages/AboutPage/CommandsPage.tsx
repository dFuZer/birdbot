import { chivoMonoFont } from "@/app/fonts";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

interface Command {
    trigger: string;
    explanation: string;
    id: string;
    condition?: Condition;
    shorthand: string;
}

const commands: Command[] = [
    /*
    {
        trigger: "/createroom",
        explanation: "Use this command to create a room with BirdBot.",
        id: "1",
        condition: "logged-in",
        shorthand: "/b",
    },
    {
        trigger: "/searchwords",
        explanation: "Use this command to search for words in the dictionary.",
        id: "2",
        shorthand: "/c",
    },
    {
        trigger: "/changemode",
        explanation: "Use this command to change the game mode of the room.",
        id: "3",
        condition: "room-owner",
        shorthand: "/cm",
    }
    */
];
type Condition = "logged-in" | "room-owner";

function ConditionBadge({ condition }: { condition: Condition }) {
    const color = condition === "logged-in" ? "bg-green-200/40 text-green-700/60" : "bg-red-200/40 text-red-600/60";
    const badgeStr = condition === "logged-in" ? "logged in" : "room owner";
    return (
        <div className={`w-[5.4rem] min-w-[5.4rem] rounded-lg py-1 text-center text-xs font-semibold text-nowrap ${color}`}>
            {badgeStr}
        </div>
    );
}

export default function CommandsPage() {
    const items = commands.map((command) => (
        <AccordionItem value={command.id} className="rounded-xl bg-neutral-50 shadow-sm" key={command.id}>
            <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger asChild>
                    <button className="flex w-full gap-4 border-neutral-100 px-6 py-3 font-semibold [&[data-state=closed]_.openIcon]:hidden [&[data-state=open]]:border-b [&[data-state=open]_.closeIcon]:hidden">
                        <div className="flex items-center gap-2">
                            <PlusCircleIcon className="closeIcon size-5" />
                            <MinusCircleIcon className="openIcon size-5" />
                            <div className={chivoMonoFont.className}>{command.trigger}</div>
                        </div>
                        <div className="flex flex-1 justify-end gap-2">
                            {command.condition && <ConditionBadge condition={command.condition} />}
                            <div>
                                <p className={`${chivoMonoFont.className} text-neutral-600`}>{command.shorthand}</p>
                            </div>
                        </div>
                    </button>
                </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="px-6 py-3 text-sm text-neutral-900">
                {command.explanation}
            </AccordionPrimitive.Content>
        </AccordionItem>
    ));

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Commands</h1>
            <p className="text-sm text-neutral-600">You can find all of the commands available on BirdBot below.</p>
            <div className="my-2 space-y-2">
                <div className="flex items-center gap-4">
                    <ConditionBadge condition="logged-in" />
                    <p className="text-sm text-neutral-600">To use this command, you need to be logged in to Croco.games</p>
                </div>
                <div className="flex items-center gap-4">
                    <ConditionBadge condition="room-owner" />
                    <p className="text-sm text-neutral-600">
                        To use this command, you need to be the owner of the room you are in
                    </p>
                </div>
            </div>
            {items.length ? (
                <Accordion type="single" className="space-y-2" collapsible>
                    {items}
                </Accordion>
            ) : (
                <p className="mt-10 text-center text-sm text-neutral-500">No commands available yet</p>
            )}
        </div>
    );
}
