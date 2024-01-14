import {
  type ErrorResponse,
  isRouteErrorResponse,
  useParams,
  useRouteError,
} from "@remix-run/react";

type StatusHandler = (info: {
  error: ErrorResponse;
  params: Record<string, string | undefined>;
}) => React.ReactNode;

export function GeneralErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <GeneralStatusCodeError
      statusCode={error.status}
      title={error.statusText}
      description={error.data}
    />
  ),
  statusHandlers,
  unexpectedErrorHandler = (error) => <UnexpectedError error={error} />,
}: {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => React.ReactNode;
}) {
  const error = useRouteError();
  const params = useParams();

  if (typeof document !== "undefined") {
    console.error(error);
  }

  return (
    <div className="container flex items-center justify-center p-8">
      {isRouteErrorResponse(error)
        ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
            error,
            params,
          })
        : unexpectedErrorHandler(error)}
    </div>
  );
}

function UnexpectedError({ error }: { error: unknown }) {
  return (
    <GeneralStatusCodeError
      statusCode={500}
      title="Internal Server Error."
      description="We are already working to solve the problem."
    >
      <p className="font-mono text-lg text-muted-foreground">
        {process.env.NODE_ENV === "development" && getErrorMessage(error)}
      </p>
    </GeneralStatusCodeError>
  );
}

export function GeneralStatusCodeError({
  statusCode,
  title,
  description,
  children,
}: {
  statusCode?: string | number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4 text-center">
      <h1 className="font-mono text-9xl font-bold text-primary">
        {statusCode}
      </h1>
      <p className="text-4xl font-semibold">{title}</p>
      <p className="text-lg text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  console.error("Unable to get error message for error", error);
  return "Unknown Error";
}
