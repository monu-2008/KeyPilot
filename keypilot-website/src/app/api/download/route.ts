import { NextResponse } from "next/server";

type ReleaseAsset = {
  name?: string;
  browser_download_url?: string;
  state?: string;
};

type GitHubRelease = {
  assets?: ReleaseAsset[];
};

// Cache the public GitHub metadata briefly to avoid unnecessary API calls.
// The ZIP itself is still downloaded directly from GitHub after the redirect.
export const revalidate = 60;

export async function GET() {
  let response: Response;

  try {
    response = await fetch(
      "https://api.github.com/repos/monu-2008/KeyPilot/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "KeyPilot-Website",
        },
        next: { revalidate: 60 },
      },
    );
  } catch {
    return NextResponse.redirect(
      "https://github.com/monu-2008/KeyPilot/releases/latest",
      302,
    );
  }

  // Before the first versioned asset is published (or if GitHub is unavailable),
  // send visitors to the release page rather than serving a stale Drive ZIP.
  if (!response.ok) {
    return NextResponse.redirect(
      "https://github.com/monu-2008/KeyPilot/releases/latest",
      302,
    );
  }

  const release = (await response.json()) as GitHubRelease;
  const asset = release.assets?.find(
    (item) =>
      /^KeyPilot-v\d+\.\d+\.\d+\.zip$/i.test(item.name ?? "") &&
      item.state === "uploaded" &&
      typeof item.browser_download_url === "string",
  );

  if (!asset?.browser_download_url) {
    return NextResponse.redirect(
      "https://github.com/monu-2008/KeyPilot/releases/latest",
      302,
    );
  }

  // Redirecting to the versioned release asset preserves its download filename,
  // for example KeyPilot-v2.2.12.zip, while the website URL stays unchanged.
  return NextResponse.redirect(asset.browser_download_url, 302);
}
