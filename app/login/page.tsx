import { GalleryVerticalEnd } from "lucide-react"
import Image from "next/image"
import { LoginForm } from "./login-form"

export const dynamic = 'force-dynamic';

export default async function LoginPage() {

  return (
    <div className="grid h-screen lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-10 overflow-hidden">
        <div className="flex justify-center gap-2 md:justify-start flex-shrink-0">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <span className="font-bold">融链-军采服务中心</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center min-h-0">
          <div className="w-full max-w-xs">
          {/* {showLogin ? (
                            <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
                        ) : (
                            <RegisterForm onSwitchToLogin={() => setShowLogin(true)} />
                        )} */}
              <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:flex lg:items-center lg:justify-center overflow-hidden">
        <Image
          src="/Illustration.png"
          alt="Image"
          width={1200}
          height={1200}
          className="max-h-full max-w-full object-contain dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  )
}
