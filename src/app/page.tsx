"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

interface Course {
  course_id: string;
  course_name: string;
  instructor_name: string;
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [getParams, setGetParams] = useState({
    course_id: "",
  });
  const [postParams, setPostParams] = useState({
    rollcall_id: "123",
    lat: 25.13587249634042,
    lng: 121.47020801301439,
  });
  const [getResponse, setGetResponse] = useState(null);
  const [postResponse, setPostResponse] = useState(null);
  const [position, setPosition] = useState<[number, number]>([
    25.13587249634042, 121.47020801301439,
  ]);

  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("userID");
    if (!token || !userID) {
      localStorage.clear();
      router.push("/login");
      return;
    }

    setLoadingCourses(true);
    try {
      const query = new URLSearchParams({
        user_id: userID,
        accessToken: token,
      }).toString();
      const res = await fetch(`/api/getCourses?${query}`);
      const data = await res.json();

      if (data.status) {
        setCourses(data.courses || []);
      } else {
        localStorage.clear();
        alert("Session invalid: " + data.message);
        router.push("/login");
      }
    } catch (error) {
      localStorage.clear();
      alert("Session expired");
      router.push("/login");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleGetRollcall = async () => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("userID");
    if (!token || !userID) {
      localStorage.clear();
      router.push("/login");
      return;
    }
    const query = new URLSearchParams({
      ...getParams,
      user_id: userID,
      accessToken: token,
    }).toString();
    const res = await fetch(`/api/getRollcall?${query}`);
    const data = await res.json();
    setGetResponse(data);
  };

  const handleMakeRollcall = async () => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("userID");
    if (!token || !userID) {
      localStorage.clear();
      router.push("/login");
      return;
    }
    const res = await fetch("/api/makeRollcall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...postParams,
        user_id: userID,
        accessToken: token,
        device: "WEB",
      }),
    });
    const data = await res.json();
    setPostResponse(data);
  };

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    setPostParams((prev) => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
    setPosition([latlng.lat, latlng.lng]);
  };

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Rollcall App
        </h1>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userID");
            localStorage.removeItem("user");
            setCourses([]);
            setGetParams({ course_id: "" });
            setPostParams({
              rollcall_id: "123",
              lat: 25.13587249634042,
              lng: 121.47020801301439,
            });
            router.push("/login");
          }}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          Logout
        </button>
      </div>

        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">

        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Your Courses
        </h2>
        {loadingCourses ? (
          <p className="text-gray-600 dark:text-gray-300">Loading courses...</p>
        ) : (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {courses
                  .filter((course) =>
                    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((course) => (
                    <div
                      key={course.course_id}
                      className={`p-4 border rounded-lg cursor-pointer transition duration-200 ${
                        getParams.course_id === course.course_id
                          ? "border-green-500 bg-green-50 dark:bg-green-900"
                          : "border-gray-300 dark:border-gray-600 hover:border-red-300"
                      }`}
                      onClick={() =>
                        setGetParams((prev) => ({
                          ...prev,
                          course_id: course.course_id,
                        }))
                      }
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {course.course_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {course.instructor_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {course.course_id}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (

              <p className="text-gray-600 dark:text-gray-300">
                No courses found.
              </p>
            )}
              <button
                onClick={fetchCourses}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg mr-4"
              >
                Refresh Courses
              </button>

          </div>
        )}

        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Get Rollcall
        </h3>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Course ID (or select from courses above)"
            value={getParams.course_id}
            onChange={(e) =>
              setGetParams((prev) => ({ ...prev, course_id: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
          <button
            onClick={handleGetRollcall}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md"
          >
            Get Rollcall
          </button>

        {getResponse && (
          <pre className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(getResponse, null, 2)}
          </pre>
        )}
      </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">

        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Make Rollcall
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <input
            type="text"
            placeholder="Rollcall ID"
            value={postParams.rollcall_id}
            onChange={(e) =>
              setPostParams((prev) => ({
                ...prev,
                rollcall_id: e.target.value,
              }))
            }
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">
            Click on the map to select location (Current:{" "}
            {position[0].toFixed(6)}, {position[1].toFixed(6)})
          </p>
          <MapComponent center={position} zoom={13} onClick={handleMapClick} />
        </div>
          <button
            onClick={handleMakeRollcall}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 shadow-md"
          >
            Make Rollcall
          </button>

        {postResponse && (
          <pre className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(postResponse, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
