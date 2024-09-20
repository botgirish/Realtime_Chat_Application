export default function Avatar({ username, userid, online }) {
    return (
      <div className="relative w-8 h-8 ml-3 flex rounded-full items-center bg-[#16423c]">
        {/* Display the first letter of the username */}
        <div className="w-full text-center text-white">
          {username[0]}
        </div>
  
        {/* Display a small red circle for offline users */}
        {!online && (
          <div className="absolute w-2 h-2 bg-red-600 bottom-0 right-0 rounded-full"></div>
        )}
  
        {/* Display the SVG icon if the user is 'Group' and online */}
        {online && username === 'Group' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="absolute size-6 bg-black rounded-xl ml-1 "
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
        )}
  
        {/* Display a small green circle for online users */}
        {online && (
          <div className="absolute w-2 h-2 bg-green-400 bottom-0 right-0 rounded-full"></div>
        )}
      </div>
    );
  }
  