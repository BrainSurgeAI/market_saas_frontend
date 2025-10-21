import ProfileCard from "./ProfileCard";

export default async function Profile() {
    return (
        <div className="container mx-auto py-6">
            <h3 className="text-xl font-bold mb-6">基本信息</h3>
            <ProfileCard />
        </div>
    );
}