"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type MobilePlaylistBoundaryProps = {
  children: ReactNode;
  debug: {
    slug: string;
    categoryCount: number;
    initialMovieCount: number;
  };
};

type MobilePlaylistBoundaryState = {
  error: string | null;
  stack: string | null;
};

export class MobilePlaylistBoundary extends Component<MobilePlaylistBoundaryProps, MobilePlaylistBoundaryState> {
  state: MobilePlaylistBoundaryState = {
    error: null,
    stack: null,
  };

  static getDerivedStateFromError(error: Error): MobilePlaylistBoundaryState {
    return {
      error: error.message,
      stack: null,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({
      error: error.message,
      stack: info.componentStack ?? null,
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="md:hidden">
        <div className="mx-4 mt-4 rounded-[2rem] border border-red-400/30 bg-red-500/10 p-5 text-red-50">
          <p className="text-xs font-black uppercase tracking-[0.22em]">Lists Debug</p>
          <h1 className="mt-2 text-2xl font-black">Mobile list UI crashed</h1>
          <div className="mt-4 grid gap-2 text-xs">
            <div>Slug: {this.props.debug.slug}</div>
            <div>Categories: {this.props.debug.categoryCount}</div>
            <div>Initial movies: {this.props.debug.initialMovieCount}</div>
            <div className="break-words">Error: {this.state.error}</div>
            {this.state.stack ? <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-black/30 p-3">{this.state.stack}</pre> : null}
          </div>
        </div>
      </div>
    );
  }
}
