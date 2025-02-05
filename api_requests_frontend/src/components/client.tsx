'use client'
import { useEffect, useState } from "react";
import { Query } from "./query";
import { FileUpload } from "./fileupload";
const API_HOST = process.env.HOST || 'http://localhost:8000';

export default function Client() {
    const [files, setFiles] = useState<Array<string>>([]);
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${API_HOST}/api/available-files`, {
                    method: 'GET'
                });

                if (response.ok) {
                    const data = await response.json();
                    setFiles(data.files);
                } else {
                    console.error('Failed to fetch files');
                }
            } catch (err) {
                console.error('Error fetching files:', err);
            }
        };

        fetchFiles();
        const intervalId = setInterval(fetchFiles, 5000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <>
        <FileUpload files={files}  apiHost={API_HOST} />
        <Query files={files} apiHost={API_HOST} />
        </>
    )
}