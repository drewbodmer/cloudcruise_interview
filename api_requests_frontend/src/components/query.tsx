import * as React from "react"
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "./ui/skeleton";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const EXAMPLE_QUERIES: Record<string, string> = {
    "www.sfgate.com.har": "Return the API that fetches the weather of San Francisco.",
    "recipescal.com.har": "Can you reverse engineer the API that gives me recipes for a given portion and calorie count?",
    "www.flightradar24.com.har": "Can you give me a curl command to get info about the Lockheed C-130H Hercules HERBLK?",
}

interface QueryProps {
    files: string[];
    apiHost: string;
}

const FormSchema = z.object({
    query: z
        .string({
            required_error: "Please write a query",
        }).min(1, "File selection is required"),

    filename: z
        .string({
            required_error: "Please select a file",
        }).min(1, "Query cannot be empty")
})

export function Query({ files, apiHost }: QueryProps) {
    const [response, setResponse] = useState<string>(`curl www.google.com`);
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [exampleQuery, setExampleQuery] = useState<string>("");
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            filename: "",
            query: ""
        }
    })

    useEffect(() => {
        getExample();
    }, [form.watch('filename')]);

    function getExample(): void {
        const filename = form.getValues('filename');
        if (Object.keys(EXAMPLE_QUERIES).includes(filename)) {
            setExampleQuery(EXAMPLE_QUERIES[filename]);
        } else {
            setExampleQuery("");
        }
    }

    function fillExample() {
        form.setValue('query', exampleQuery)
    }


    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setInProgress(true);
        setResponse("");
        toast({
            title: "Querying file...",
        });

        const response = await fetch(`${apiHost}/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        setInProgress(false);

        if (response.ok) {
            const { message } = await response.json();
            setResponse(message)
            toast({
                title: "Success",
            });
        } else {
            const message = await response.json();
            toast({
                title: "Error",
                description: message.detail,
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="w-[80vw] min-w-[650px] max-w-[1000px]">
            <CardHeader>
                <CardTitle>2. Query .har file</CardTitle>
                <CardDescription>Ask the LLM to re-create a curl based on the har file.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
                        <FormField
                            control={form.control}
                            name="filename"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>File Name</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select a file to query" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Files</SelectLabel>
                                                {files.map((file, index) => (
                                                    <SelectItem key={file} value={file}>
                                                        {file}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="query"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Query</FormLabel>
                                    <Button
                                        className="mx-4"
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            fillExample();
                                        }}
                                        disabled={exampleQuery === ""}
                                    >
                                        Fill example query
                                    </Button>
                                    <FormControl>
                                        <Textarea
                                         key="query"
                                         placeholder={exampleQuery} {...field} />
                                    </FormControl>
                                    <FormDescription>Write a query describing what request you are looking for.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter>
                {inProgress ? (

                    <div className="flex flex-col space-y-3 w-full">
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ) : (
                    <pre className="mt-2 max-w-full rounded-md bg-slate-950 p-4">
                        <div className="relative">
                            <button
                                className="absolute right-1 text-xs text-gray-400 bg-slate-950 p-1 rounded"
                                onClick={() => navigator.clipboard.writeText(response)}
                            >
                            Copy
                            </button>
                            <br></br>
                            <code className="text-xs text-white whitespace-pre-wrap">{response}</code>
                        </div>
                    </pre>
                )}
            </CardFooter>
        </Card>
    )
}
