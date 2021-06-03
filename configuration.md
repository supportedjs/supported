# Proposal for configuring supported

Teams may want to customize the parameters of a support policy. For instance, a team may want to ignore certain dependencies, i.e. not enforce upgrades for certain dependencies. They may also want different upgrade cadences for specific dependencies. Lastly, in many cases, simply turning on a support policy and expecting consumers to immediately adhere to the policy is untenable (for instance, a major upgrade with a migration may be emminently required shortly after turning on a support policy). There needs to be a way to provide a grace period for onboarding to the support policy, while still providing a warning for when dependencies must be updated.

```JSON
{
  "primary": {
    "upgradeBudget": {
      "major": 4,
      "minor": 4
    }
  }
}
```

```TypeScript
type Quarter = number;
type Weeks = number;

interface UpgradeBudget {
  major: Quarters;
  minor: Quarters;
  patch: Quarters;

  // Any releases that happen within this number of weeks of the end of a quarter
  // are considered to have been released the next quarter
  tailGracePeriod: Weeks;
}

interface Policy {
  upgradeBudget: UpgradeBudget;
  
  // Used for easing users into a new policy: the support policy will act as
  // if all versions of dependencies were released on this date if the actual
  // release date is before the date. Users will be warned of the effective
  // deprecation date whenever the support policy tool is run.
  globalEffectiveReleaseDate?: Date;
}

interface PrimaryPolicy extends Policy {
  // If we ignore a dependency, that means that the given package will not affect
  // whether or not a consumer is within the support policy
  ignoredDependencies?: string[];
}

interface CustomPolicy extends Policy {
  // A whitelist of packages that are looked at for this policy
  dependencies: string[];
}

interface PolicyConfiguration {
  primary?: PrimaryPolicy
  custom?: CustomPolicy[]
}
```

### Conflicts
We should evaluate the config file up front and throw if there are conflicts. We should also throw if there are no policies defined.

* The same package cannot be in multiple `CustomPolicy` configs
* A `CustomPolicy` cannot list a package ignored by the primary policy

## Alternatives

We could support policies that are relative to time intervals other than quarters, like months, years, or weeks.