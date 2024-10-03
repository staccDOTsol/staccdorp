import { IconTwitterX, IconGithub } from "./Icons";

export function Footer() {
    return (
        <footer className="w-full flex justify-center space-x-4">
            <a href="https://github.com/staccdotsol/airship" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary/90">
                <IconGithub size={24} />
            </a>
            <a href="https://twitter.com/staccoverflow" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary/90">
                <IconTwitterX size={24} />
            </a>
        </footer>
    );
}

