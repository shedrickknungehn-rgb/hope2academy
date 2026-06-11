import { Routes, Route, Navigate } from "react-router-dom";
import { SiteLayout } from "@/components/SiteLayout";
import Index from "@/routes/index";
import About from "@/routes/about";
import Team from "@/routes/team";
import Departments from "@/routes/departments";
import Projects from "@/routes/projects";
import Stories from "@/routes/stories";
import Contact from "@/routes/contact";
import GetInvolved from "@/routes/get-involved";
import Login from "@/routes/login";
import PortalLayout from "@/routes/portal";
import PortalIndex from "@/routes/portal.index";
import PortalAdmin from "@/routes/portal.admin";
import PortalAlumni from "@/routes/portal.alumni";
import PortalParent from "@/routes/portal.parent";
import PortalProfile from "@/routes/portal.profile";
import PortalStudent from "@/routes/portal.student";
import PortalSuperadmin from "@/routes/portal.superadmin";
import PortalTeacher from "@/routes/portal.teacher";
import PortalModule from "@/routes/portal.m.$key";

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Index />} />
        <Route path="about" element={<About />} />
        <Route path="team" element={<Team />} />
        <Route path="departments" element={<Departments />} />
        <Route path="projects" element={<Projects />} />
        <Route path="stories" element={<Stories />} />
        <Route path="contact" element={<Contact />} />
        <Route path="get-involved" element={<GetInvolved />} />
        <Route path="login" element={<Login />} />
        <Route path="portal" element={<PortalLayout />}>
          <Route index element={<PortalIndex />} />
          <Route path="admin" element={<PortalAdmin />} />
          <Route path="alumni" element={<PortalAlumni />} />
          <Route path="parent" element={<PortalParent />} />
          <Route path="profile" element={<PortalProfile />} />
          <Route path="student" element={<PortalStudent />} />
          <Route path="superadmin" element={<PortalSuperadmin />} />
          <Route path="teacher" element={<PortalTeacher />} />
          <Route path="m/:key" element={<PortalModule />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}