export function Footer() {
    return (
        <footer className="border-t mt-auto">
            <div className="container flex flex-col items-center justify-center gap-2 md:flex-row">
                <p className="text-center text-xs leading-loose text-muted-foreground md:text-left">
                    Built by{" "}
                    <a
                        href="https://github.com/yourusername"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4"
                    >
                        RyanBro Limited
                    </a>
                    {/* . The source code is available on{" "} */}
                    {/* <a
                        href="https://github.com/yourusername/project"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4"
                    >
                        GitHub
                    </a> */}
                    .
                </p>
                <p className="text-center text-xs text-muted-foreground md:text-left">
                    © 2024 Your Company. All rights reserved.
                </p>
                <p className="text-center text-xs text-muted-foreground ml-auto">
                    v0.1.0
                </p>
            </div>
        </footer>
    );
}