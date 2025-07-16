import { BadRequest } from "../errors";

const checkFileType = async (data: string) => {
    if (!data) return;

    try {
        const supportedFileTypes = [
            'docs', 'pdf', 'xls', 'csv',
            'jpg', 'jpeg', 'png', 'svg', 'webp',
            'mp4', 'webmv'
        ];

        const categories: Record<string, string[]> = {
            'images': ['jpg', 'jpeg', 'webp', 'png', 'svg'],
            'video': ['mp4', 'webmv'],
            'document': ['pdf', 'docs', 'xls', 'csv']
        };

        if (!supportedFileTypes.includes(data)) {
            throw new BadRequest('file format not supported!👮‍♂️');
            return;
        }

        let fileCategory = 'unknown';
        for (const [category, extensions] of Object.entries(categories)) {
            if (extensions.includes(data)) {
                fileCategory = category;
                break;
            }
        }

        console.log('result:', fileCategory);
        return fileCategory;

    } catch (error) {
        console.log('error checking file type', error);
    }
};

export default checkFileType;

// checkFileType('docs').then(result => console.log('Returned category:', result));
