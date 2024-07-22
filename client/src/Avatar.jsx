export default function Avatar({username,userid,online}){
    return(
        <div className=" bg-black relative w-8 h-8 ml-3 flex rounded-full items-center">
            <div className=" text-center w-full text-yellow-300 ">{username[0]}</div>
            <div className=" absolute w-2 h-2 bg-red-600 bottom-0 right-0 rounded-full"></div>
            {online && (
            <div className=" absolute w-2 h-2 bg-green-500 bottom-0 right-0 rounded-full"></div>
        )}
            
        </div>
    )
}