import { memo } from "react"
import Lottie from "lottie-react"
import animationData from "@/app/assets/lottie/truck.json"

export const LoadingOverlay = memo(function LoadingOverlay() {
    const defaultOptions = {
		loop: true,
		autoplay: true,
		animationData: animationData,
		rendererSettings: {
		  preserveAspectRatio: "xMidYMid slice"
		}
	  };
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="relative flex">
                <div className="h-50 w-50">
                <Lottie
						animationData={animationData}
						loop={true}
						autoplay={true}
						rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
                        width={50}
                        height={50}
					/>
                </div>
            </div>
        </div>
    )
})