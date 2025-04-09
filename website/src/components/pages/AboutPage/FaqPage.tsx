import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

interface Question {
    trigger: string;
    answer: string;
    id: string;
}

const questions: Question[] = [
    /*
    {
        trigger: "How can I create a room with BirdBot ?",
        answer: "Use /b in a room where BirdBot is present to create a room with BirdBot.",
        id: "1",
    }
    */
];
export default function FaqPage() {
    const items = questions.map((question) => (
        <AccordionItem value={question.id} className="rounded-xl bg-neutral-50 shadow-sm" key={question.id}>
            <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger asChild>
                    <button className="flex w-full items-center gap-2 border-neutral-100 px-6 py-3 font-semibold [&[data-state=closed]>.openIcon]:hidden [&[data-state=open]]:border-b [&[data-state=open]>.closeIcon]:hidden">
                        <PlusCircleIcon className="closeIcon size-5" />
                        <MinusCircleIcon className="openIcon size-5" />
                        <div>{question.trigger}</div>
                    </button>
                </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="px-6 py-3 text-sm text-neutral-900">
                {question.answer}
            </AccordionPrimitive.Content>
        </AccordionItem>
    ));

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
            {items.length ? (
                <Accordion type="single" className="space-y-2" collapsible>
                    {items}
                </Accordion>
            ) : (
                <p className="mt-10 text-center text-sm text-neutral-500">No questions available yet</p>
            )}
        </div>
    );
}
